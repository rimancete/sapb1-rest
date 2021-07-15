import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmLedgerAccountService } from '../../core/simple-farm/ledger-account/ledger-account.service'
import { HanaLedgerAccountService } from '../../core/b1/hana/ledger-account/ledger-account.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import { Exception } from 'src/core/exception';

@Injectable()
export class LedgerAccountService extends Runner {

	private logger = new Logger(LedgerAccountService.name);

	constructor(
		private readonly hanaLedgerAccountService: HanaLedgerAccountService,
		private readonly simpleFarmLedgerAccountService: SimpleFarmLedgerAccountService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
		const records = await this.hanaLedgerAccountService.getNotIntegrated();

		console.log('Ledger Account records', records);


		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}
		try{
			for (const record of records) {

				const NAcctCode = record.AcctCode

				const data = { 
					Code: NAcctCode.replace(/\./g, ""),
					Description: record.AcctName,
					CompanyCode: '9',
					SubsidiaryCode: '1',
				};

				console.log('Ledger Account Data::', data);

					const responseObject = await this.simpleFarmLedgerAccountService.upsert(data);
					if (!responseObject.HasErrors){
							console.log('ledger-account - record', record);
							const responseLedgerAccountIntegrated = await this.hanaLedgerAccountService.setIntegrated(record);
							console.log('ledger-account - responseLedgerAccountIntegrated', responseLedgerAccountIntegrated);
							await this.logsService.logSuccess({
										key: record.SolReqNum, module: LogModule.LEDGER_ACCOUNT, requestObject: record, responseObject
							});
					}else{
						console.log('ledger-account - record',record);
						console.log('ledger-account - responseObject',responseObject);
						// localiza erros: valor em "ErrorMessages", "CriticalError" e "Data"
						const errorMessages = responseObject.Result.Data.ErrorMessages;
						const criticalError = responseObject.Result.Data.CriticalError;
						const dataError = responseObject.Result.Data;
						await this.logsService.logError({ 
							key: record.SolReqNum, 
							module: LogModule.LEDGER_ACCOUNT, 
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
				await this.hanaLedgerAccountService.setError(record);
				await this.logsService.logError({ key: record.SolReqNum, module: LogModule.LEDGER_ACCOUNT, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}


	}
}