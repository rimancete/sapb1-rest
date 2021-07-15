import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmTransactionService } from '../../core/simple-farm/transaction/transaction.service';
import * as _ from 'lodash';
import { Runner } from '../../core/runner';
import { HanaTransactionService } from 'src/core/b1/hana/transaction/transaction.service';
import { LogsService } from 'src/core/logs/logs.service';
import { LogModule } from 'src/core/logs/interface';
import { Exception } from 'src/core/exception';

@Injectable()
export class TransactionService extends Runner {

	private logger = new Logger(TransactionService.name);

	constructor(
    private readonly simpleFarmTransactionService: SimpleFarmTransactionService,
    private readonly hanaTransactionService: HanaTransactionService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
		const countNotIntegrated = await this.hanaTransactionService.countNotIntegrated();
		const records = await this.hanaTransactionService.getNotIntegrated();

		if (records.length > 0) {
				this.logger.log(`Found ${records.length} records to integrate...`)
		}    
    
		try {
			if (records.length > 0) {
				if (countNotIntegrated[0].QTDE === records.length){
					for (const record of records) {
						const responseObject = await this.simpleFarmTransactionService.upsert(record);
						if (!responseObject.HasErrors){
							console.log('transaction record', record);
							const responseTransactionIntegrated = await this.hanaTransactionService.setIntegrated(record);
							await this.logsService.logSuccess(
								{key: record.Code, module: LogModule.TRANSACTION, requestObject: record, responseObject
							});
						}
						else{
							// const dataError = responseObject.Result.Data;
							console.log('transaction - responseObject ERROR',responseObject);
							const criticalError = responseObject.Result.Data.CriticalError;
							if (!criticalError || criticalError === '') {
								console.log('request-situation-history record errorMessages TRUE', record);
								const responseSetError = await this.hanaTransactionService.setError(record);
								await this.hanaTransactionService.updateRetry(record);
								await this.logsService.logError({ 
									key: record.Code, 
									module: LogModule.TRANSACTION, 
									exception: new Exception({
										code: 'SF002',
										message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
										request: record,
										response: responseObject.Result.Data.ErrorMessages,
									}), 
								});
							}
							else{
								console.log('transaction record criticalError TRUE', record);
								const responseSetError = await this.hanaTransactionService.setError(record);
								await this.hanaTransactionService.updateRetry(record);
								await this.logsService.logError({ 
									key: record.Code, 
									module: LogModule.TRANSACTION, 
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
					console.log('transaction count ERROR', countNotIntegrated[0].QTDE);
					console.log('transaction RECORDS count ERROR', records.length);
					for (const record of records) {
						const responseSetError = await this.hanaTransactionService.setError(record);
						await this.hanaTransactionService.updateRetry(record);
						await this.logsService.logError({ 
							key: record.Code, 
							module: LogModule.TRANSACTION, 
							exception: new Exception({
								code: 'SF002',
								message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
								request: record,
								response: 'Divergência nos ítens. Favor reprocessar a transação.',
							}), 
						});
					}
				
				}
			}
		}
		catch (exception) {
			console.log('transaction - exception',exception);
			console.log('transaction records exception', records);
			for (const record of records) {
				const responseSetError = await this.hanaTransactionService.setError(record);
				await this.hanaTransactionService.updateRetry(record);
				await this.logsService.logError({ key: record.Code, module: LogModule.TRANSACTION, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}
	}
}