import { Injectable, Logger } from '@nestjs/common';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { SimpleFarmReturnInvoiceService } from 'src/core/simple-farm/invoice-return/invoice-return.service';
import { HanaInvoiceReturnService } from 'src/core/b1/hana/invoice-return/invoice-return.service';
import { Exception } from 'src/core/exception';

@Injectable()
export class InvoiceReturnService extends Runner {

	private logger = new Logger(InvoiceReturnService.name);

	constructor(
		private readonly hanaReturnInvoiceService: HanaInvoiceReturnService,
		private readonly simpleFarmReturnInvoiceService: SimpleFarmReturnInvoiceService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
		//const days = await this.hanaReturnInvoiceService.getConfigParamsDays();
		//console.log('This Days:' , days);

		const countNotIntegrated = await this.hanaReturnInvoiceService.countNotIntegrated();
		const records = await this.hanaReturnInvoiceService.getNotIntegrated();
		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}
		try {
			if (records.length > 0){
				if (countNotIntegrated[0].QTDE === records.length){
					for (const record of records) {
						const rawItens = await this.hanaReturnInvoiceService.getParcel(record);
						const itens = rawItens.map(item => {
							return {
								empresa: record.Empresa,
								nfNumero: record.nFNumero,
								nfChave: record.nfChave,
								Parcela: item.Parcela,
								vencimento: item.Vencimento,
								valor: Number(item.valor),
								numTitulo: 0
							}
						});
						const recordData = {
							nFNumero: record.nFNumero,
							empresa: record.Empresa,
							nfData: record.nfData,
							nfValor: Number(record.nfValor),
							idPedido: record.idPedido,
							transacao: record.transacao,
							nfPeso: Number(record.nfPeso),
							nfChave: record.nfChave,
							nfTipo: record.nfTipo,
							especDocto: record.especDocto,
							serie: record.serie,
							emitente: record.emitente,
							vlImpostoPerc: record.vlImpostoPerc,
							vlImpostoPeso: record.vlImpostoPeso,
							dscImposto: record.dscImposto,
							nfPesoBruto: record.nfPesoBruto,
							nfDataDigit: record.nfDataDigit,
							nfRomaneio:  record.nfRomaneio,
							Type: record.Type,
							Code: record.AbsID,
							CompanyCode: record.BPLId,
							StartDate: record.StartDate,
							EndDate: record.EndDate,
							Status: 1,
							ProviderCode: record.BpCode,
							Remark: record.Remarks,
							nfParcelas: itens
						}
						const responseObject = await this.simpleFarmReturnInvoiceService.upsert(recordData);
						if (!responseObject.HasErrors){
								console.log('invoice-return record', record);
								const responseInvoiceIntegrated = await this.hanaReturnInvoiceService.setIntegrated(record);
								await this.logsService.logSuccess({
									key: record.DocEntry, module: LogModule.INVOICE_RETURN, requestObject: record, responseObject
								});
						}
						else{
							console.log('invoice-return - responseObject ERROR',responseObject);
							const criticalError = responseObject.Result.Data.CriticalError;
							if (!criticalError || criticalError === '') {
								console.log('request-situation-history record errorMessages TRUE', record);
								const responseSetError = await this.hanaReturnInvoiceService.setError(record);
								await this.hanaReturnInvoiceService.updateRetry(record);
								await this.logsService.logError({ 
									key: record.DocEntry, 
									module: LogModule.INVOICE_RETURN, 
									exception: new Exception({
										code: 'SF002',
										message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
										request: record,
										response: responseObject.Result.Data.ErrorMessages,
									}), 
								});
	
							}
							else{
								console.log('invoice-return record criticalError TRUE', record);
								const responseSetError = await this.hanaReturnInvoiceService.setError(record);
								await this.hanaReturnInvoiceService.updateRetry(record);
								await this.logsService.logError({ 
									key: record.DocEntry, 
									module: LogModule.INVOICE_RETURN, 
									exception: new Exception({
										code: 'SF002',
										message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
										request: record,
										response: criticalError,
									}), 
								});
							}

						}
					}
				}
				else{
					console.log('invoice-return record count ERROR', countNotIntegrated[0].QTDE);
					console.log('invoice-return RECORDS count ERROR', records.length);
					for (const record of records) {
						const responseSetError = await this.hanaReturnInvoiceService.setError(record);
						await this.hanaReturnInvoiceService.updateRetry(record);
						await this.logsService.logError({ 
							key: record.DocEntry, 
							module: LogModule.INVOICE_RETURN, 
							exception: new Exception({
								code: 'SF002',
								message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
								request: record,
								response: 'Divergência nos ítens. Favor reprocessar o retorno da nota de saída.',
							}), 
						});
					}
				
				}
			}
		}
		catch (exception) {
			console.log('invoice-return - exception',exception);
			console.log('invoice-return records exception', records);
			for (const record of records) {	
				const responseSetError = await this.hanaReturnInvoiceService.setError(record);
				await this.hanaReturnInvoiceService.updateRetry(record);
				await this.logsService.logError({ key: record.DocEntry, module: LogModule.INVOICE_RETURN, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}

}