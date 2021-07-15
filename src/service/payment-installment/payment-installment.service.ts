import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmPaymentInstallmentService } from '../../core/simple-farm/payment-installment/payment-installment.service'
import { HanaPaymentInstallmentService } from '../../core/b1/hana/payment-installment/payment-installment.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import { Exception } from 'src/core/exception';

@Injectable()
export class PaymentInstallmentService extends Runner {

	private logger = new Logger(PaymentInstallmentService.name);

	constructor(
		private readonly hanaPaymentInstallmentService: HanaPaymentInstallmentService,
		private readonly simpleFarmPaymentInstallmentService: SimpleFarmPaymentInstallmentService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
		const records = await this.hanaPaymentInstallmentService.getNotIntegrated();

		console.log('Payment Installment records', records);


		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}
		try{
			for (const record of records) {

				const data = {
					PaymentCondutionCode: record.GroupNum,
					Sequence: record.IntsNo,
					PercentValue: record.InstPrcnt,
					Days: record.InstDays,
				};

				console.log('Payment Installment Data::', data);
				
					const responseObject = await this.simpleFarmPaymentInstallmentService.upsert(record);
					// se NÂO tiver erro no response
					if (!responseObject.HasErrors){
							console.log('payment-installment - record', record);
							const responseRequestSituationHistory = await this.hanaPaymentInstallmentService.setIntegrated(record);
							console.log('payment-installment - responseRequestSituationHistory', responseRequestSituationHistory);
							await this.logsService.logSuccess({
										key: record.SolReqNum, module: LogModule.PAYMENT_INSTALLMENT, requestObject: record, responseObject
							});
        			// se tiver erro no response, salva no log como erro
					}else{
						await this.hanaPaymentInstallmentService.updateRetry(record);
						console.log('payment-installment - record',record);
						console.log('payment-installment - responseObject',responseObject);
						// localiza erros: valor em "ErrorMessages", "CriticalError" e "Data"
						const errorMessages = responseObject.Result.Data.ErrorMessages;
						const criticalError = responseObject.Result.Data.CriticalError;
						const dataError = responseObject.Result.Data;
						await this.logsService.logError({ 
							key: record.SolReqNum, 
							module: LogModule.PAYMENT_INSTALLMENT, 
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
				await this.hanaPaymentInstallmentService.updateRetry(record);
				await this.logsService.logError({ key: record.SolReqNum, module: LogModule.PAYMENT_INSTALLMENT, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}


	}
}