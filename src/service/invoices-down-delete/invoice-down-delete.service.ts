import { Injectable, Logger } from '@nestjs/common';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { HanaInvoiceDownDeleteService } from 'src/core/b1/hana/invoice-down-delete/invoice-down-delete.service';
import { SimpleFarmInvoiceDownDeleteService } from 'src/core/simple-farm/invoice-down-delete/invoice-down-delete.service';
import { Exception } from 'src/core/exception';

@Injectable()
export class InvoiceDownDeleteService extends Runner {

	private logger = new Logger(InvoiceDownDeleteService.name);

	constructor(
		private readonly hanaInvoiceDownDeleteService: HanaInvoiceDownDeleteService,
		private readonly simpleFarmInvoiceDownDeleteService: SimpleFarmInvoiceDownDeleteService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
		const countNotIntegrated = await this.hanaInvoiceDownDeleteService.countNotIntegrated();
		const records = await this.hanaInvoiceDownDeleteService.getNotIntegrated();
		
		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}
		try {
			if (countNotIntegrated[0].QTDE === records.length){
				if(records.length > 0){
					for (const record of records){
						const formatData = {
							empresa: record.empresa,
							nfChave: record.nfChave,
							parParcela: record.parParcela
						};
		
						const responseObject = await this.simpleFarmInvoiceDownDeleteService.upsert(formatData);
						if (!responseObject.HasErrors){
							console.log('invoice-down-delete record', record);
							const responseInvoiceDownDelete = await this.hanaInvoiceDownDeleteService.setIntegrated(record);
							await this.logsService.logSuccess({
								key: record.DocEntry, module: LogModule.INVOICE_DOWN_DELETE, requestObject: record, responseObject
							});
						}
						else{
							// const dataError = responseObject.Result.Data;
							console.log('invoice-down-delete record Error', record);
							console.log('invoice-down-delete responseObject ERROR', responseObject);
							const criticalError = responseObject.Result.Data.CriticalError;
							if (!criticalError || criticalError === '') {
									console.log('invoice-down-delete record errorMessages TRUE', record);
									const responseSetError = await this.hanaInvoiceDownDeleteService.setError(record);
									await this.hanaInvoiceDownDeleteService.updateRetry(record);
									await this.logsService.logError({ 
										key: record.DocEntry, 
										module: LogModule.INVOICE_DOWN_DELETE, 
										exception: new Exception({
											code: 'SF002',
											message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
											request: record,
											// testa onde estão os erros e insere-o
											response:responseObject.Result.Data.ErrorMessages,
										}), 
									});
							}							
							else{
								console.log('invoice-down-delete record criticalError TRUE', record);
								const responseSetError = await this.hanaInvoiceDownDeleteService.setError(record);
								await this.hanaInvoiceDownDeleteService.updateRetry(record);
								await this.logsService.logError({ 
									key: record.DocEntry, 
									module: LogModule.INVOICE_DOWN_DELETE, 
									exception: new Exception({
										code: 'SF002',
										message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
										request: record,
										// testa onde estão os erros e insere-o
										response:criticalError,
									}), 
								});
							}
						}
					}
				}
			}
			else{
				console.log('invoice-down-delete record count ERROR', countNotIntegrated[0].QTDE);
				console.log('invoice-down-delete RECORDS count ERROR', records.length);
				for (const record of records){
					const responseSetError = await this.hanaInvoiceDownDeleteService.setError(record);
					await this.hanaInvoiceDownDeleteService.updateRetry(record);
					await this.logsService.logError({ 
						key: record.DocEntry, 
						module: LogModule.INVOICE_DOWN_DELETE, 
						exception: new Exception({
							code: 'SF002',
							message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
							request: record,
							// testa onde estão os erros e insere-o
							response:'Divergência nos ítens. Favor reprocessar a exclusão da baixa da nota.',
						}), 
					});
				}
			}
		}
		catch (exception) {
			console.log('invoice-down-delete - exception',exception);
			console.log('invoice-down-delete records exception', records);
			for (const record of records){
				const responseSetError = await this.hanaInvoiceDownDeleteService.setError(record);
				await this.hanaInvoiceDownDeleteService.updateRetry(record);
				await this.logsService.logError({ key: record.DocEntry, module: LogModule.INVOICE_DOWN_DELETE, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}

}