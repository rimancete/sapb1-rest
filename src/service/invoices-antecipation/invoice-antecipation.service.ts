import { Injectable, Logger } from '@nestjs/common';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { HanaInvoiceDownDeleteService } from 'src/core/b1/hana/invoice-down-delete/invoice-down-delete.service';
import { SimpleFarmInvoiceDownDeleteService } from 'src/core/simple-farm/invoice-down-delete/invoice-down-delete.service';
import { HanaInvoiceAntecipationService } from 'src/core/b1/hana/invoice-antecipation/invoice-antecipation.service';
import { SimpleFarmInvoiceAntecipationService } from 'src/core/simple-farm/invoice-antecipation/invoice-antecipation.service';
import { InvoiceSF } from 'src/core/b1/service-layer/invoice/interfaces';
import { Exception } from 'src/core/exception';


@Injectable()
export class InvoiceAntecipationService extends Runner {

	private logger = new Logger(InvoiceAntecipationService.name);

	constructor(
		private readonly hanaInvoiceAntecipationService: HanaInvoiceAntecipationService,
		private readonly simpleFarmInvoiceAntecipationService: SimpleFarmInvoiceAntecipationService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
	
		const countNotIntegrated = await this.hanaInvoiceAntecipationService.countNotIntegrated();
		const records = await this.hanaInvoiceAntecipationService.getNotIntegrated();
    
		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}
		try {
			if (countNotIntegrated[0].QTDE === records.length){
				if (records.length > 0){
					for (const record of records) {
						const recordData = {
							empresa: Number(record.empresa),
							IdPedido: Number(record.idPedido),
							numTitulo: record.numTitulo,
							vencimento: record.dataPagto,
							valor: Number(record.valorPagto),
							Parcela: Number(record.ptaxPagto),
							seqFctoFinanErp: Number(record.seqFctoFinanERP)
						};
						const baixaData = {
							empresa: Number(record.empresa),
							IdPedido: Number(record.idPedido),
							parParcela: Number(record.seqFctoFinanERP),
							numTitulo: record.numTitulo,
							dataPagto: record.dataPagto,
							valorPagto: Number(record.valorPagto),
							ptaxPagto: Number(record.ptaxPagto),
							seqFctoFinanErp: Number(record.seqFctoFinanERP)
						};
		
						const responseObject = await this.simpleFarmInvoiceAntecipationService.upsert(recordData,baixaData);
						if (!responseObject.HasErrors){
							console.log('invoice-antecipation record', record);
							const responseInvoiceAntecipation = await this.hanaInvoiceAntecipationService.setIntegrated(record);
							await this.logsService.logSuccess({	
								key: record.DocNum, module: LogModule.INVOICE_ANTECIPATION, requestObject: record, responseObject 
							});
						}
						else{
							console.log('invoice-antecipation record Error', record);
							console.log('invoice-antecipation responseObject ERROR', responseObject);
							const criticalError = responseObject.Result.Data.CriticalError;
							if (!criticalError || criticalError === '') {
									console.log('invoice-antecipation record errorMessages TRUE', record);

									const responseSetError = await this.hanaInvoiceAntecipationService.setError(record);
									await this.hanaInvoiceAntecipationService.updateRetry(record);
									await this.logsService.logError({ 
										key: record.DocNum, 
										module: LogModule.INVOICE_ANTECIPATION, 
										exception: new Exception({
										code: 'SF002',
										message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
										request: record,
										response:responseObject.Result.Data.ErrorMessages,
										}),
									});
							}
							else{
								console.log('invoice-antecipation record criticalError TRUE', record);

								const responseSetError = await this.hanaInvoiceAntecipationService.setError(record);
								await this.hanaInvoiceAntecipationService.updateRetry(record);
								await this.logsService.logError({ 
									key: record.DocNum, 
									module: LogModule.INVOICE_ANTECIPATION, 
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
				console.log('invoice-antecipation record count ERROR', countNotIntegrated[0].QTDE);
				console.log('invoice-antecipation RECORDS count ERROR', records,length);
				for (const record of records) {

					const responseSetError = await this.hanaInvoiceAntecipationService.setError(record);
					await this.hanaInvoiceAntecipationService.updateRetry(record);
					await this.logsService.logError({ 
						key: record.DocNum, 
						module: LogModule.INVOICE_ANTECIPATION, 
						exception: new Exception({
							code: 'SF002',
							message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
							request: record,
							response: 'Divergência nos ítens da OS. Favor reprocessar a antecipação de parcela.',
						}),
					});
				}	
			}
		}
		catch (exception) {	
			console.log('invoice-antecipation - exception',exception);
			console.log('invoice-antecipation records exception', records);
			for (const record of records) {
				const responseSetError = await this.hanaInvoiceAntecipationService.setError(record);
				await this.hanaInvoiceAntecipationService.updateRetry(record);
				await this.logsService.logError({ key: record.DocNum, module: LogModule.INVOICE_ANTECIPATION, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}

}