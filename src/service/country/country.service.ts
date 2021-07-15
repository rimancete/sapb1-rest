import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmCountryService } from '../../core/simple-farm/country/country.service';
import { HanaCountryService } from '../../core/b1/hana/country/country.service'
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import { Exception } from '../../core/exception';

import * as _ from 'lodash';

@Injectable()
export class CountryService extends Runner {

	private logger = new Logger(CountryService.name);

	constructor(
		private readonly hanaCountryService: HanaCountryService,
		private readonly simpleFarmCountryService: SimpleFarmCountryService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {

		const records = await this.hanaCountryService.getNotIntegrated();

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {
			try {
				const responseObject = await this.simpleFarmCountryService.upsert(record);

				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					const responseCountryIntegrated = await this.hanaCountryService.setIntegrated(record);
					await this.logsService.logSuccess({
						key: record.Code, module: LogModule.COUNTRY, requestObject: record, responseObject
					});
				// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaCountryService.updateRetry(record);
					// localiza valor em "ErrorMessages", "CriticalError" ou "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					await this.logsService.logError({ 
						key: record.Code, 
						module: LogModule.COUNTRY, 
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
				await this.hanaCountryService.updateRetry(record);
				await this.logsService.logError({ key: record.Code, module: LogModule.COUNTRY, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}

}