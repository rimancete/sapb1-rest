import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmAccountPaymentService } from '../../core/simple-farm/account-payment/account-payment.service'
import { HanaAccountPaymentService } from '../../core/b1/hana/account-payment/account-payment.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Runner } from '../../core/runner';
import { Exception } from 'src/core/exception';

@Injectable()
export class AccountPaymentService extends Runner {

	private logger = new Logger(AccountPaymentService.name);

	constructor(
		private readonly hanaAccountPaymentService: HanaAccountPaymentService,
		private readonly simpleFarmAccountPaymentService: SimpleFarmAccountPaymentService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
		const records = await this.hanaAccountPaymentService.getNotIntegrated();

		console.log('account payment records', records);

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		

		try{
			for (const record of records) {

					let NType = null;

					if(record.Canceled === 'Y'){
						NType = 2
					}else{
						NType = 1
					}
				
					const data = { 
						SupplierCode: record.CardCode,
						Id: record.DocNum,
						CompanyCode: record.BPLId,
						SubsidiaryCode: record.U_ALFA_Filial,
						CostCenterCode: record.OcrCode,
						MovementDate: record.DocDate,
						AccountCode: record.Account,
						Values: record.DocTotal,
						Type: NType
					};

					console.log('Acount Payment Data::', data);

					const responseObject = await this.simpleFarmAccountPaymentService.upsert(data);
					// se NÂO tiver erro no response
					if (!responseObject.HasErrors){
							console.log('account-payment - record', record);
							const responseRequestSituationHistory = await this.hanaAccountPaymentService.setIntegrated(record);
							console.log('account-payment - responseRequestSituationHistory', responseRequestSituationHistory);
							await this.logsService.logSuccess({
										key: record.SolReqNum, module: LogModule.ACCOUNT_PAYMENT, requestObject: record, responseObject
							});
        			// se tiver erro no response, salva no log como erro
					}else{
						await this.hanaAccountPaymentService.updateRetry(record);
						console.log('account-payment - record',record);
						console.log('account-payment - responseObject',responseObject);
						// localiza erros: valor em "ErrorMessages", "CriticalError" e "Data"
						const errorMessages = responseObject.Result.Data.ErrorMessages;
						const criticalError = responseObject.Result.Data.CriticalError;
						const dataError = responseObject.Result.Data;
						await this.logsService.logError({ 
							key: record.SolReqNum, 
							module: LogModule.ACCOUNT_PAYMENT, 
							exception: new Exception({
							code: 'SF002',
							message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
							request: record,
							// testa em qual local retorna erro e salva-o
							response: 
							typeof errorMessages !== 'undefined' || errorMessages !== [] ? errorMessages : 
							typeof criticalError !== 'undefined' || criticalError !== '' ? criticalError : 
							typeof dataError === 'string' ? dataError : 'Erro desconhecido',
							}), 
						});		
					}
			}
		}catch (exception) {
			for (const record of records) {
				await this.hanaAccountPaymentService.updateRetry(record);
				await this.logsService.logError({ key: record.SolReqNum, module: LogModule.ACCOUNT_PAYMENT, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}


	}
}