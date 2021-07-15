import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmCurrencyService } from '../../core/simple-farm/currency/currency.service';
import { HanaCurrencyService } from '../../core/b1/hana/currency/currency.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { Exception } from '../../core/exception';

const currencyCodesJson = require('../../../ISOCode.json');

@Injectable()
export class CurrencyService extends Runner {

	private logger = new Logger(CurrencyService.name);

	constructor(
		private readonly hanaCurrencyService: HanaCurrencyService,
		private readonly simpleFarmCurrencyService: SimpleFarmCurrencyService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {

		const records = await this.hanaCurrencyService.getNotIntegrated();


		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {

			const code = _.find(currencyCodesJson, { AlphabeticCode: record.ISOCode })
			record.ISOCode = code.NumericCode;
			// record.Active = record.Active == "Y" ? true : false;

			try {
				const responseObject = await this.simpleFarmCurrencyService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					const responseCurrencyIntegrated = await this.hanaCurrencyService.setIntegrated(record);
					await this.logsService.logSuccess({
						key: record.Symbol, module: LogModule.CURRENCY, requestObject: record, responseObject
					});
				// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaCurrencyService.updateRetry(record);
					// localiza valor em "ErrorMessages", "CriticalError" ou "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					this.logsService.logError({ 
						key: record.Symbol, 
						module: LogModule.CURRENCY, 
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
				await this.hanaCurrencyService.updateRetry(record);
				await this.logsService.logError({ 
					key: record.Symbol, module: LogModule.CURRENCY, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}

}



