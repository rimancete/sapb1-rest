import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmStateService } from '../../core/simple-farm/state/state.service';
import { HanaStateService } from '../../core/b1/hana/state/state.service'
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import { Runner } from '../../core/runner';
import { Exception } from '../../core/exception';

@Injectable()
export class StateService extends Runner {

	private logger = new Logger(StateService.name);

	constructor(
		private readonly hanaStateService: HanaStateService,
		private readonly simpleFarmStateService: SimpleFarmStateService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {

		const records = await this.hanaStateService.getNotIntegrated();

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {
			try {
				const responseObject = await this.simpleFarmStateService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					const responseState = await this.hanaStateService.setIntegrated(record);
					await this.logsService.logSuccess({
						key: record.Code, module: LogModule.STATE, requestObject: record, responseObject
					});
        		// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaStateService.updateRetry(record);
					// localiza valor em "ErrorMessages", "CriticalError" e "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					await this.logsService.logError({ 
						key: record.Code, 
						module: LogModule.STATE, 
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
			}catch (exception) {
				await this.hanaStateService.updateRetry(record);
				await this.logsService.logError({ key: record.Code, module: LogModule.STATE, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}

}