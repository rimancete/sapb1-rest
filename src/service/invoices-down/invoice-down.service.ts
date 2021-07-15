import { Injectable, Logger } from '@nestjs/common';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { HanaInvoiceDownService } from 'src/core/b1/hana/invoice-down/invoice-down.service';
import { SimpleFarmInvoiceDownService } from 'src/core/simple-farm/invoice-down/invoice-down.service';
import { Exception } from 'src/core/exception';

@Injectable()
export class InvoiceDownService extends Runner {

  private logger = new Logger(InvoiceDownService.name);

  constructor(
    private readonly hanaInvoiceDownService: HanaInvoiceDownService,
    private readonly simpleFarmInvoiceDownService: SimpleFarmInvoiceDownService,
    private readonly logsService: LogsService
  ) {
    super();
  }

  async proccess() {
    const countNotIntegrated = await this.hanaInvoiceDownService.countNotIntegrated();
    const records = await this.hanaInvoiceDownService.getNotIntegrated();

    if (records.length > 0) {
      this.logger.log(`Found ${records.length} records to integrate...`)
    }
    try {
			if (countNotIntegrated[0].QTDE === records.length){
        if (records.length > 0){
          for (const record of records){
            const register = {
              empresa: record.empresa,
              nfNumero: record.nfNumero,
              nfChave: record.nfChave,
              parParcela: record.parParcela,
              seqPagamento: record.seqPagamento,
              dataPagto: record.dataPagto,
              valorPagto: Number(record.valorPagto),
              ptaxPagto: Number(record.ptaxPagto),
              seqFctoFinanErp: record.seqFctoFinanErp
            };

            const responseObject = await this.simpleFarmInvoiceDownService.upsert(register);
            if (!responseObject.HasErrors){
              console.log('invoice-down record', record);
              const responseInvoiceDown = await this.hanaInvoiceDownService.setIntegrated(record);
              await this.logsService.logSuccess({
                key: record.DocEntry, module: LogModule.INVOICE_DOWN, requestObject: record, responseObject
              });
            }
            else{
							console.log('invoice-down record Error', record);
							console.log('invoice-down responseObject ERROR', responseObject);
              const criticalError = responseObject.Result.Data.CriticalError;

							if (!criticalError || criticalError === '') {
                  console.log('invoice-down record errorMessages TRUE', record);
                  const responseSetError = await this.hanaInvoiceDownService.setError(record);
                  await this.hanaInvoiceDownService.updateRetry(record);
                  await this.logsService.logError({ 
                    key: record.DocEntry, 
                    module: LogModule.INVOICE_DOWN, 
                    exception: new Exception({
                      code: 'SF002',
                      message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
                      request: record,
                      response:responseObject.Result.Data.ErrorMessages,
                      }),
                   });
                
              }
              else {
                console.log('invoice-down record criticalError TRUE', record);
                const responseSetError = await this.hanaInvoiceDownService.setError(record);
                await this.hanaInvoiceDownService.updateRetry(record);
                await this.logsService.logError({ 
                  key: record.DocEntry, 
                  module: LogModule.INVOICE_DOWN, 
                  exception: new Exception({
                    code: 'SF002',
                    message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
                    request: record,
                    response:criticalError,
                  }),
                });
              }    
            }        
          }
        }
      }
      else{
				console.log('invoice-down record count ERROR', countNotIntegrated[0].QTDE);
        console.log('invoice-down RECORDS count ERROR', records.length);
        for (const record of records){
          const responseSetError = await this.hanaInvoiceDownService.setError(record);
          await this.hanaInvoiceDownService.updateRetry(record);
          await this.logsService.logError({ 
            key: record.DocEntry, 
            module: LogModule.INVOICE_DOWN, 
            exception: new Exception({
              code: 'SF002',
              message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
              request: record,
              response:'Divergência nos ítens. Favor reprocessar a baixa da nota.',
            }),
          });
        }
      }
    }
    catch (exception) {
			console.log('invoice-down - exception',exception);
      console.log('invoice-down records exception', records);
      for (const record of records){
        const responseSetError = await this.hanaInvoiceDownService.setError(record);

        await this.hanaInvoiceDownService.updateRetry(record);
        await this.logsService.logError({ key: record.DocEntry, module: LogModule.INVOICE_DOWN, exception });

      }
    }

    if (records.length > 0) {
      this.logger.log(`Finished integration...`)
    }

  }

}