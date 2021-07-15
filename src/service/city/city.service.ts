import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmCityService } from '../../core/simple-farm/city/city.service';
import { HanaCityService } from '../../core/b1/hana/city/city.service'
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { Exception } from '../../core/exception';

@Injectable()
export class CityService extends Runner {

	private logger = new Logger(CityService.name);

	constructor(
		private readonly hanaCityService: HanaCityService,
		private readonly simpleFarmCityService: SimpleFarmCityService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {

		const records = await this.hanaCityService.getNotIntegrated();

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {
			try {
				const responseObject = await this.simpleFarmCityService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					const responseCityInventory = await this.hanaCityService.setIntegrated(record);
					await this.logsService.logSuccess({
						key: record.Code, module: LogModule.CITY, requestObject: record, responseObject
					});
				// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaCityService.updateRetry(record)
					// localiza valor em "ErrorMessages", "CriticalError" e "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					await this.logsService.logError({ 
						key: record.Code, 
						module: LogModule.CITY, 
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
				await this.hanaCityService.updateRetry(record)
				await this.logsService.logError({ key: record.Code, module: LogModule.CITY, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}

}