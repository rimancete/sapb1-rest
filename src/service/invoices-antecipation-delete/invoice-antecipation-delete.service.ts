import { Injectable, Logger } from '@nestjs/common';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { HanaInvoiceAntecipationDeleteService } from 'src/core/b1/hana/invoice-antecipation-delete/invoice-antecipation-delete.service';
import { SimpleFarmInvoiceAntecipationDeleteService } from 'src/core/simple-farm/invoice-antecipation-delete/invoice-antecipation-delete.service';
import { Exception } from 'src/core/exception';

@Injectable()
export class InvoiceAntecipationDeleteService extends Runner {

	private logger = new Logger(InvoiceAntecipationDeleteService.name);

	constructor(
		private readonly hanaInvoiceAntecipationDeleteService: HanaInvoiceAntecipationDeleteService,
		private readonly simpleFarmInvoiceAntecipationDeleteService: SimpleFarmInvoiceAntecipationDeleteService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {

		const records = await this.hanaInvoiceAntecipationDeleteService.getNotIntegrated();
		
		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {
			try {
				const responseObject = await this.simpleFarmInvoiceAntecipationDeleteService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					await this.hanaInvoiceAntecipationDeleteService.setIntegrated(record);
					this.logsService.logSuccess({
						key: record.U_ALFA_pedidoId, module: LogModule.INVOICE_ANTECIPATION_DELETE, requestObject: record, responseObject
					});
					
				// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaInvoiceAntecipationDeleteService.updateRetry(record);
					// localiza erros: valor em "ErrorMessages", "CriticalError" e "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					await this.logsService.logError({ 
						key: record.U_ALFA_pedidoId, 
						module: LogModule.INVOICE_ANTECIPATION_DELETE, 
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
				await this.hanaInvoiceAntecipationDeleteService.updateRetry(record);
				this.logsService.logError({ key: record.U_ALFA_pedidoId, module: LogModule.INVOICE_ANTECIPATION_DELETE, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}

}