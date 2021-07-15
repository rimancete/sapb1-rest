import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmSupplierClientService } from '../../core/simple-farm/supplier-client/supplier-client.service';
import { HanaBusinessPartnersService } from '../../core/b1/hana/business-partners/business-partners.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import { Runner } from '../../core/runner';
import { Exception } from 'src/core/exception';

@Injectable()
export class SupplierClientService extends Runner {

  private logger = new Logger(SupplierClientService.name);

  constructor(
    private readonly hanaBusinessPartnersService: HanaBusinessPartnersService,
    private readonly simpleFarmSupplierClientService: SimpleFarmSupplierClientService,
    private readonly logsService: LogsService
  ) {
    super();
  }

  async proccess() {

    try {

      let records = await this.hanaBusinessPartnersService.getNotIntegrated();

      records = records.filter(r => _.isInteger(_.parseInt(r.Code)));

      if (records.length > 0) {
        this.logger.log(`Found ${records.length} records to integrate...`)
      }

      for (const record of records) {
        try {
          const adrs = await this.hanaBusinessPartnersService.getAllAdress(record.Code);
          record.Addresses = adrs;
          const responseObject = await this.simpleFarmSupplierClientService.upsert(record);
					// se NÂO tiver erro no response
					if (!responseObject.HasErrors){
            const responseSupplierClient = await this.hanaBusinessPartnersService.setIntegrated(record);
            await this.logsService.logSuccess({
            key: record.Code, module: LogModule.SUPLIER_CLIENT, requestObject: record, responseObject
            });
          // se tiver erro no response, salva no log como erro
          }else{
            await this.hanaBusinessPartnersService.updateRetry(record);
            // localiza valor em "ErrorMessages", "CriticalError" e "Data"
            const errorMessages = responseObject.Result.Data.ErrorMessages;
            const criticalError = responseObject.Result.Data.CriticalError;
            const dataError = responseObject.Result.Data;
            this.logsService.logError({ 
              key: record.Code, 
              module: LogModule.SUPLIER_CLIENT, 
              exception: new Exception({
								code: 'SF002',
								message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
								request: record,
								// testa onde estão os erros e insere-o
                response: 
                typeof errorMessages !== 'undefined' || errorMessages !== [] ? errorMessages : 
                typeof criticalError !== 'undefined' || criticalError !== '' ? criticalError : 
                typeof dataError === 'string' ? dataError : 'Erro desconhecido',
              }), 
            });
          }
        }
        catch (exception) {
          await this.hanaBusinessPartnersService.updateRetry(record);
          await this.logsService.logError({ key: record.Code, module: LogModule.SUPLIER_CLIENT, exception });
        }
      }

      if (records.length > 0) {
        this.logger.log(`Finished integration...`)
      }
    }
    catch (ex) {

    }


  }

}