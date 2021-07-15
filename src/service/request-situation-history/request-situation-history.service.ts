import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmRequestSituationHistoryService } from '../../core/simple-farm/request-situation-history/request-situation-history.service';
import { HanaRequestSituationHistoryService } from '../../core/b1/hana/request-situation-history/request-situation-history.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Runner } from '../../core/runner';
import { Exception } from 'src/core/exception';

@Injectable()
export class RequestSituationHistoryService extends Runner {

	private logger = new Logger(RequestSituationHistoryService.name);

	constructor(
		private readonly hanaRequestSituationHistoryService: HanaRequestSituationHistoryService,
		private readonly simpleFarmRequestSituationHistoryService: SimpleFarmRequestSituationHistoryService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {

		const countNotIntegrated = await this.hanaRequestSituationHistoryService.countNotIntegrated();
		const records = await this.hanaRequestSituationHistoryService.getNotIntegrated();

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}
		try{
			if (countNotIntegrated[0].QTDE === records.length){
				const data = records.map(record => {
				return { 
					SolReqNum: record.SolReqNum, 
					IdKey: record.IdKey, 
					HisDate: record.HisDate, 
					Status: record.Status 
				}
				});
				if (data.length > 0){
					const responseObject = await this.simpleFarmRequestSituationHistoryService.upsert(data);
					// const dataError = responseObject.Result.Data;
					for (const record of records) {
							if (!responseObject.HasErrors){
									console.log('request-situation-history - record', record);
									const responseRequestSituationHistory = await this.hanaRequestSituationHistoryService.setIntegrated(record);
									await this.logsService.logSuccess({
										key: record.SolReqNum, module: LogModule.SITUATION_HISTORY, requestObject: record, responseObject
									});
							}
							else{
								console.log('request-situation-history - record Error',record);
								console.log('request-situation-history - responseObject ERROR',responseObject);
								const criticalError = responseObject.Result.Data.CriticalError;
								if (!criticalError || criticalError === '') {
									// GATEC como encontrar um histórico da situação de solicitação específica? IdKey?
									const errorMessages = _.find(_.get(responseObject, 'Result.Data.ErrorMessages', []), r => r['Item'] === record["IdKey"] );
									if (!errorMessages){
										console.log('request-situation-history record errorMessages FALSE', record);
										const responseRequestSituationHistory = await this.hanaRequestSituationHistoryService.setIntegrated(record);
										await this.logsService.logSuccess({
											key: record.SolReqNum, module: LogModule.SITUATION_HISTORY, requestObject: record, responseObject
										});
									}
									else{
										console.log('request-situation-history record errorMessages TRUE', record);
										const responseSetError = await this.hanaRequestSituationHistoryService.setError(record);
										await this.hanaRequestSituationHistoryService.updateRetry(record);
										await this.logsService.logError({ 
											key: record.SolReqNum, 
											module: LogModule.SITUATION_HISTORY, 
											exception: new Exception({
												code: 'SF002',
												message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
												request: record,
												response:errorMessages,
											}), 
										});		
									}
								}
								else {
									console.log('request-situation-history record criticalError TRUE', record);
									const responseSetError = await this.hanaRequestSituationHistoryService.setError(record);
									await this.hanaRequestSituationHistoryService.updateRetry(record);
									await this.logsService.logError({ 
										key: record.SolReqNum, 
										module: LogModule.SITUATION_HISTORY, 
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
			else {
				console.log('request-situation-history record count ERROR', countNotIntegrated[0].QTDE);
        		console.log('request-situation-history RECORDS count ERROR', records.length);
				for (const record of records){
					const responseSetError = await this.hanaRequestSituationHistoryService.setError(record);
					await this.hanaRequestSituationHistoryService.updateRetry(record);
					await this.logsService.logError({ 
						key: record.SolReqNum, 
						module: LogModule.SITUATION_HISTORY, 
						exception: new Exception({
							code: 'SF002',
							message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
							request: record,
							response:'Divergência nos ítens. Favor reprocessar o histórico da situação da solicitação.',
						}), 
					});		
				}
			}
		}catch (exception) {
			console.log('request-situation-history - exception',exception);
			console.log('request-situation-history records exception', records);
			for (const record of records) {
				const responseSetError = await this.hanaRequestSituationHistoryService.setError(record);
				await this.hanaRequestSituationHistoryService.updateRetry(record);
				await this.logsService.logError({ key: record.SolReqNum, module: LogModule.SITUATION_HISTORY, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}


	}
}