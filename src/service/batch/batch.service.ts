import { Injectable, Logger } from '@nestjs/common';
import { LogsService } from '../../core/logs/logs.service'
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import { Runner } from '../../core/runner';
import { HanaBatchService } from 'src/core/b1/hana/batch/batch.service';
import { SimpleFarmBatchService } from 'src/core/simple-farm/batch/batch.service';
import { Exception } from 'src/core/exception';

@Injectable()
export class BatchService extends Runner {

	private logger = new Logger(BatchService.name);

	constructor(
    private readonly simpleFarmBatchService: SimpleFarmBatchService,
		private readonly hanaBatchservice: HanaBatchService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {

		const records = await this.hanaBatchservice.getNotIntegrated();
    
		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {
			try {
				const responseObject = await this.simpleFarmBatchService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					const responseBatchIntegrated = await this.hanaBatchservice.setIntegrated(record);
					await this.logsService.logSuccess({
						key: record.Code, module: LogModule.BATCH, requestObject: record, responseObject
					});
				// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaBatchservice.updateRetry(record);
					// localiza valor em "ErrorMessages", "CriticalError" e "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					await this.logsService.logError({ 
						key: record.Code, 
						module: LogModule.BATCH, 
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
				await this.hanaBatchservice.updateRetry(record);
				await this.logsService.logError({ key: record.Code, module: LogModule.BATCH, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}

}