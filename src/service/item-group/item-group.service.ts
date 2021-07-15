import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SimpleFarmItemGroupService } from '../../core/simple-farm/item-group/item-group.service';
import { HanaItemGroupService } from '../../core/b1/hana/item-group/item-group.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import { Runner } from '../../core/runner';
import { Exception } from 'src/core/exception';

@Injectable()
export class ItemGroupService extends Runner {

	private logger = new Logger(ItemGroupService.name);

	constructor(
		private readonly simpleFarmItemGroupService: SimpleFarmItemGroupService,
		private readonly hanaItemGroupService: HanaItemGroupService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
		const records = await this.hanaItemGroupService.getNotIntegrated();

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {
			try {
        
				const responseObject = await this.simpleFarmItemGroupService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					await this.hanaItemGroupService.setIntegrated(record);
					await this.logsService.logSuccess({
						key: record.Code, module: LogModule.ITEM_GROUP, requestObject: record, responseObject
					});
          		// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaItemGroupService.updateRetry(record);
					// localiza erros: valor em "ErrorMessages", "CriticalError" e "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					await this.logsService.logError({ 
						key: record.Code, 
						module: LogModule.ITEM_GROUP, 
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
				
			} catch (exception) {
				await this.hanaItemGroupService.updateRetry(record);
				await this.logsService.logError({ key: record.Code, module: LogModule.ITEM_GROUP, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}
}