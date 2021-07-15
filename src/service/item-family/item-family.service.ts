import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmItemFamilyService } from '../../core/simple-farm/item-family/item-family.service';
import { HanaItemFamilyService } from '../../core/b1/hana/item-family/item-family.service'
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import { Runner } from '../../core/runner';
import { Exception } from 'src/core/exception';

@Injectable()
export class ItemFamilyService extends Runner {

	private logger = new Logger(ItemFamilyService.name);

	constructor(
		private readonly hanaItemFamilyService: HanaItemFamilyService,
		private readonly simpleFarmItemFamilyService: SimpleFarmItemFamilyService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
		const records = await this.hanaItemFamilyService.getNotIntegrated();

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}


		for (const record of records) {
			try {        
				const responseObject = await this.simpleFarmItemFamilyService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					await this.hanaItemFamilyService.setIntegrated(record);
					await this.logsService.logSuccess({
						key: record.Code, module: LogModule.ITEM_FAMILY, requestObject: record, responseObject
					});
          		// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaItemFamilyService.updateRetry(record);
					// localiza erros: valor em "ErrorMessages", "CriticalError" e "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					await this.logsService.logError({ 
						key: record.Code, 
						module: LogModule.ITEM_FAMILY, 
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
				await this.hanaItemFamilyService.updateRetry(record);
				await this.logsService.logError({ key: record.Code, module: LogModule.ITEM_FAMILY, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}
}