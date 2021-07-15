import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmCurrencyQuoteService } from '../../core/simple-farm/currency-quote/currency-quote.service';
import { HanaCurrencyQuoteService } from '../../core/b1/hana/currency-quote/currency-quote.service'
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Exception } from '../../core/exception';

const currencyCodesJson = require('../../../ISOCode.json');

@Injectable()
export class CurrencyQuoteService extends Runner {

	private logger = new Logger(CurrencyQuoteService.name);

	constructor(
		private readonly hanaCurrencyQuoteService: HanaCurrencyQuoteService,
		private readonly simpleFarmCurrencyQuoteService: SimpleFarmCurrencyQuoteService,
		private readonly logsService: LogsService
	) {
		super();
	}

  @Cron(CronExpression.EVERY_6_HOURS)
  async run() {
    await super.run();
  }

	async proccess() {

		const records = await this.hanaCurrencyQuoteService.getNotIntegrated();

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {
			const key = `${record.CurrencyIsoFrom}|${record["QuoteDate"]}`;

			try {
				record.Quote = parseFloat(record.Quote);
				const currencyFrom = record.CurrencyIsoFrom;
				const codeFrom = _.find(currencyCodesJson, { AlphabeticCode: record.CurrencyIsoFrom })
				record.CurrencyIsoFrom = codeFrom.NumericCode;
				const codeTo = _.find(currencyCodesJson, { AlphabeticCode: record.CurrencyIsoTo })
				record.CurrencyIsoTo = codeTo.NumericCode;

				const responseObject = await this.simpleFarmCurrencyQuoteService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					const responseCurrencyQuoteIntegrated = await this.hanaCurrencyQuoteService.setIntegrated(currencyFrom, record["QuoteDate"]);
					await this.logsService.logSuccess({
						key, module: LogModule.CURRENCY_QUOTE, requestObject: record, responseObject
					});
				// se tiver erro no response, salva no log como erro
				}else{
					const currencyFrom = record.CurrencyIsoFrom;
					await this.hanaCurrencyQuoteService.updateRetry(currencyFrom, record["QuoteDate"]);
					// localiza valor em "ErrorMessages", "CriticalError" ou "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					await this.logsService.logError({ 
						key, 
						module: LogModule.CURRENCY_QUOTE, 
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
				const currencyFrom = record.CurrencyIsoFrom;
				await this.hanaCurrencyQuoteService.updateRetry(currencyFrom, record["QuoteDate"]);
				await this.logsService.logError({ key, module: LogModule.CURRENCY_QUOTE, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}
}