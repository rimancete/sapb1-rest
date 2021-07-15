import { Injectable, Logger } from '@nestjs/common';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { HanaPaymentConditionService } from 'src/core/b1/hana/payment-condition/payment-condition';
import { SimpleFarmPaymentConditionService } from 'src/core/simple-farm/payment-condition/payment-condition.service';
import { Exception } from 'src/core/exception';

@Injectable()
export class PaymentConditionService extends Runner {

  private logger = new Logger(PaymentConditionService.name);

  constructor(
    private readonly hanaPaymentConditionService: HanaPaymentConditionService,
    private readonly simpleFarmPaymentConditionService: SimpleFarmPaymentConditionService,
    private readonly logsService: LogsService
  ) {
    super();
  }

  async proccess() {

    const records = await this.hanaPaymentConditionService.getNotIntegrated();

    if (records.length > 0) {
      this.logger.log(`Found ${records.length} records to integrate...`)
    }
    
    for (const record of records) {
      try {
        const rawInstallments = await this.hanaPaymentConditionService.getNotIntegratedInstallments(record.GroupNum);
        const installments = rawInstallments.map(Installment => {
          return {
            PaymentConditionCode: Installment.CTGCode,
            Sequence: Installment.IntsNo,
            PercentValue: Installment.InstPrcnt,
            Days: Installment.InstDays
          }
        });
        const recordData = {
          Code: record.GroupNum,
          Description: record.PymntGroup,
          ShortName: record.PymntGroup.substring(0, 20),
          FixedDay: false,
          Anticipated: false,
          Type: record.Type,
          Active: true,
          Installments: installments
        }
        
        const responseObject = await this.simpleFarmPaymentConditionService.upsert(recordData);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
          await this.hanaPaymentConditionService.setIntegrated(record);
          await this.logsService.logSuccess({
        	  key: record.GroupNum, module: LogModule.PAYMENT_CONDITION, requestObject: recordData, responseObject
          });
        // se tiver erro no response, salva no log como erro
        }else{
          await this.hanaPaymentConditionService.updateRetry(record);
					// localiza erros: valor em "ErrorMessages", "CriticalError" e "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
          await this.logsService.logError({ 
            key: record.GroupNum, 
            module: LogModule.PAYMENT_CONDITION, 
            exception: new Exception({
							code: 'SF002',
							message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
							request: record,
							// testa onde estão os erros e insere-o
              response: 
              typeof errorMessages !== 'undefined' || errorMessages !== [] ? errorMessages : 
              typeof criticalError !== 'undefined' || criticalError !== '' ? criticalError : 
              typeof dataError === 'string' ? dataError : 'Erro desconhecido',
              }), });
        }
      } catch (exception) {
          await this.hanaPaymentConditionService.updateRetry(record);
          await this.logsService.logError({ key: record.GroupNum, module: LogModule.PAYMENT_CONDITION, exception });
      }
    }

    if (records.length > 0) {
      this.logger.log(`Finished integration...`)
    }

  }

}