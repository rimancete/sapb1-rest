import { Injectable, Logger } from '@nestjs/common';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { SimpleFarmCanceledInvoiceService } from 'src/core/simple-farm/invoice-canceled/invoice-canceled.service';
import { HanaInvoiceCanceledService } from 'src/core/b1/hana/invoice-canceled/invoice-canceled.service';
import { Exception } from 'src/core/exception';


@Injectable()
export class InvoiceCanceledService extends Runner {

	private logger = new Logger(InvoiceCanceledService.name);

	constructor(
		private readonly hanaCanceledInvoiceService: HanaInvoiceCanceledService,
		private readonly simpleFarmCanceledInvoiceService: SimpleFarmCanceledInvoiceService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {

		const records = await this.hanaCanceledInvoiceService.getNotIntegrated();
		
		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}
		try{
			for (const record of records) {
					const responseObject = await this.simpleFarmCanceledInvoiceService.upsert(record);
					// localiza valor em "ErrorMessages", "CriticalError" e "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;

					// se NÂO tiver erro no response
					if (!responseObject.HasErrors){
							console.log('invoice-canceled - record', record);
							console.log('invoice-canceled - SEM erro responseObject', responseObject);
							const responseCanceledIntegrated = await this.hanaCanceledInvoiceService.setIntegrated(record);
							console.log('invoice-canceled - responseCanceledIntegrated', responseCanceledIntegrated);
							await this.logsService.logSuccess({
								key: record.Code, module: LogModule.INVOICE_CANCELATION, requestObject: record, responseObject
							});

          			// se tiver erro no response, salva no log como erro
					}else{
						await this.hanaCanceledInvoiceService.updateRetry(record);
						console.log('invoice-canceled - responseObject',responseObject);
						console.log('invoice-canceled - errorMessages',errorMessages);
						console.log('invoice-canceled - criticalError',criticalError);
						console.log('invoice-canceled - dataError',dataError);
						await this.logsService.logError({ 
							key: record.AbsID, 
							module: LogModule.INVOICE_CANCELATION, 
							// APAGAR requestObject: record,  
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

		}catch (exception) {
			console.log('invoice-canceled - exception',exception);
			for (const record of records) {
				await this.hanaCanceledInvoiceService.updateRetry(record);
				this.logsService.logError({ key: record.AbsID, module: LogModule.INVOICE_CANCELATION, requestObject: record,  exception });
			}				
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}

}