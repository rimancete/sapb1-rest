import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmAccountOriginService } from '../../core/simple-farm/account-origin/account-origin.service'
import { HanaAccountOriginService } from '../../core/b1/hana/account-origin/account-origin.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Runner } from '../../core/runner';
import { Exception } from 'src/core/exception';

@Injectable()
export class AccountOriginService extends Runner {

	private logger = new Logger(AccountOriginService.name);

	constructor(
		private readonly hanaAccountOriginService: HanaAccountOriginService,
		private readonly simpleFarmAccountOriginService: SimpleFarmAccountOriginService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
		const records = await this.hanaAccountOriginService.getNotIntegrated();

		console.log('account origin records', records);

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}
		try{
			for (const record of records) {

				let NTransType = record.TransType;
				console.log('NTransType', NTransType);

				let NCode = '';
				let NDesciption = '';

				switch (NTransType) {
				
					case '13' :
						NCode = 'NS';
						NDesciption = 'VENDAS (Nota de Saída)' 
					break;
					case '14':
						NCode = 'DS';
						NDesciption = 'VENDAS (Dev. Nota de Saída)'
					break;
					case '15':
						NCode = 'EN';
						NDesciption = 'VENDAS (Entraga)'
					break;	
					case '16' :
						NCode = 'DV';
						NDesciption = 'VENDAS (Devolução)' 
					break;
					case '18':
						NCode = 'NE';
						NDesciption = 'COMPRAS (Nota de Entrada)'
					break;
					case '19':
						NCode = 'DE';
						NDesciption = 'COMPRAS (Dev. Nota de Entrada)'
					break;	
					case '20' :
						NCode = 'PD';
						NDesciption = 'COMPRAS (Recebimento de Mercadoria)' 
					break;
					case '21':
						NCode = 'DM';
						NDesciption = 'COMPRAS (Devolução de Mercadoria)'
					break;
					case '24':
						NCode = 'CR';
						NDesciption = 'BANCO (contas a receber)'
					break;	
					case '30' :
						NCode = 'LC';
						NDesciption = 'FINANÇAS (Lançamento contabil manual)' 
					break;
					case '46':
						NCode = 'CP';
						NDesciption = 'BANCO (Contas a pagar)'
					break;
					case '59':
						NCode = 'EM';
						NDesciption = 'PRODUÇÃO (Entrada de produto acabado)'
					break;
					case '60' :
						NCode = 'SO';
						NDesciption = 'ESTOQUE (Saída de Mercadoria)' 
					break;
					case '67':         
						NCode = 'TF';
						NDesciption = 'ESTOQUE (Transferencia do estoque)'
					break;
					case '162' :
						NCode = 'MR';
						NDesciption = 'ESTOQUE (Reavaliação do estoque)' 
					break;
					case '202':
						NCode = 'OP';                                    
						NDesciption = 'PRODUÇÃO (Ordem de Produção)'
					break;
					case '203':
						NCode = 'AT';                                                                                                                                                                             
						NDesciption = 'VENDAS (Fatura de Adiant a Cliente)'
					break;
					case '204':
						NCode = 'AT';
						NDesciption = 'COMPRAS (Fatura de Adiant a Fornecedor)'
					break;
					case '321':
						NCode = 'RI';
						NDesciption = '(Reconciliação Interna)'
					break;
					case '10000071':
						NCode = 'RI';
						NDesciption = 'ESTOQUE (Lançamento de estoque)'
					break;	
					case '1470000049' :
						NCode = 'AC';
						NDesciption = 'FINANÇAS (Capitalização)' 
					break;
					case '1470000071':
						NCode = 'DR';
						NDesciption = 'FINANÇAS (Depreciação)'
					break;
					case '1470000090':
						NCode = 'FT';
						NDesciption = 'PRODUÇÃO (Entrada de produto acabado)'
					break;
					case '1470000094':
						NCode = 'RT';
						NDesciption = 'FINANÇAS (Baixa)'
					break;	
					case '310000001' :
						NCode = 'SI';                                                                                                                                   
						NDesciption = 'ESTOQUE (Saldo Inicial do inventario)' 
					break;
							
				}	

				const data = {
					Code: NCode,
					Description: NDesciption
				};

				console.log('account origin Data::', data);                                                                                                                                                                                                                                                                   
				
					const responseObject = await this.simpleFarmAccountOriginService.upsert(data);
					// se NÂO tiver erro no response
					if (!responseObject.HasErrors){
							console.log('account-origin - record', record);
							const responseRequestSituationHistory = await this.hanaAccountOriginService.setIntegrated(record);
							console.log('account-origin - responseRequestSituationHistory', responseRequestSituationHistory);
							await this.logsService.logSuccess({
										key: record.SolReqNum, module: LogModule.ACCOUNT_ORIGIN, requestObject: record, responseObject
					});
        			// se tiver erro no response, salva no log como erro
					}else{
						await this.hanaAccountOriginService.updateRetry(record);
						console.log('account-origin - record',record);
						console.log('account-origin - responseObject',responseObject);
						// localiza erros: valor em "ErrorMessages", "CriticalError" e "Data"
						const errorMessages = responseObject.Result.Data.ErrorMessages;
						const criticalError = responseObject.Result.Data.CriticalError;
						const dataError = responseObject.Result.Data;
						await this.logsService.logError({ 
							key: record.SolReqNum, 
							module: LogModule.ACCOUNT_ORIGIN, 
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
				await this.hanaAccountOriginService.updateRetry(record);
				await this.logsService.logError({ key: record.SolReqNum, module: LogModule.ACCOUNT_ORIGIN, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}


	}
}