import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmLedgerAccountValueService } from '../../core/simple-farm/ledger-account-value/ledger-account-value.service'
import { HanaLedgerAccountValueService } from '../../core/b1/hana/ledger-account-value/ledger-account-value.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Runner } from '../../core/runner';
import { Exception } from 'src/core/exception';

@Injectable()
export class LedgerAccountValueService extends Runner {

	private logger = new Logger(LedgerAccountValueService.name);

	constructor(
		private readonly hanaLedgerAccountValueService: HanaLedgerAccountValueService,
		private readonly simpleFarmLedgerAccountValueService: SimpleFarmLedgerAccountValueService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
		const records = await this.hanaLedgerAccountValueService.getNotIntegrated();

		console.log('ledger account value records', records);


		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}
		try{
			for (const record of records) {



				  let NRefDate = moment(record.RefDate).format('YYYY-MM-DD');
				  let Nvalue = record.Debit - record.Credit;
				  const NAccount = record.Account
				   
				  let NValues = [{
					"CurrencyIso": 986,
					"Value": Nvalue
				  }]

					const data = {
						CompanyCode: record.BPLId,
						SubsidiaryCode: record.BPLId,
						AccountCode: NAccount.replace(/\./g, ""),
						CostCenterCode: record.ProfitCode,
						//Month: record.RefDate, // Desativa opcional - Função para transformar em mês
						Month: NRefDate,
						// Values: record.Values, //  Desativa opcional - Função debit - credito ( debito menos o credito)
						Values:NValues,
						OriginCode: record.TransType, // Fazer Switch com os numeros cadastrados
					};

					console.log('ledger account value Data::', data);

					const responseObject = await this.simpleFarmLedgerAccountValueService.upsert(data);
					// se NÂO tiver erro no response
					if (!responseObject.HasErrors){
							console.log('ledger-account-value - record', record);
							const responseRequestSituationHistory = await this.hanaLedgerAccountValueService.setIntegrated(record);
							console.log('ledger-account-value - responseRequestSituationHistory', responseRequestSituationHistory);
							await this.logsService.logSuccess({
										key: record.SolReqNum, module: LogModule.LEDGER_ACCOUNT_VALUE, requestObject: record, responseObject
							});
        			// se tiver erro no response, salva no log como erro
					}else{
						await this.hanaLedgerAccountValueService.updateRetry(record);
						console.log('ledger-account-value - record',record);
						console.log('ledger-account-value - responseObject',responseObject);
						// localiza erros: valor em "ErrorMessages", "CriticalError" e "Data"
						const errorMessages = responseObject.Result.Data.ErrorMessages;
						const criticalError = responseObject.Result.Data.CriticalError;
						const dataError = responseObject.Result.Data;
						await this.logsService.logError({ 
							key: record.SolReqNum, 
							module: LogModule.LEDGER_ACCOUNT_VALUE, 
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
				await this.hanaLedgerAccountValueService.updateRetry(record);
				await this.logsService.logError({ key: record.SolReqNum, module: LogModule.LEDGER_ACCOUNT_VALUE, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}


	}
}