import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SimpleFarmItemService } from '../../core/simple-farm/item/item.service';
import { HanaItemService } from '../../core/b1/hana/item/item.service'
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import { Runner } from '../../core/runner';
import { InventoryLocationService } from '../inventory-location/inventory-location.service';
import { Exception } from 'src/core/exception';

@Injectable()
export class ItemService extends Runner {

	private logger = new Logger(ItemService.name);

	constructor(
		private readonly hanaItemService: HanaItemService,
		private readonly simpleFarmItemService: SimpleFarmItemService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
		const records = await this.hanaItemService.getNotIntegrated();

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {
			try {
				const responseObject = await this.simpleFarmItemService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					await this.hanaItemService.setIntegrated(record);
					await this.logsService.logSuccess({
						key: record.Code, module: LogModule.ITEM, requestObject: record, responseObject
					});
          		// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaItemService.updateRetry(record);
					// localiza erros: valor em "ErrorMessages", "CriticalError" e "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					await this.logsService.logError({ 
						key: record.Code, 
						module: LogModule.ITEM, 
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
				await this.hanaItemService.updateRetry(record);
				await this.logsService.logError({ key: record.Code, module: LogModule.ITEM, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}
}