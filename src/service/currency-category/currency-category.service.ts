import { Injectable, Logger } from '@nestjs/common';
import { CurrencyCategory } from '../../core/simple-farm/currency-category/interfaces';
import { SimpleFarmCurrencyCategoryService } from '../../core/simple-farm/currency-category/currency-category.service';
import { HanaCurrencyCategoryService } from '../../core/b1/hana/currency-category/currency-category.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { Exception } from '../../core/exception';

@Injectable()
export class CurrencyCategoryService extends Runner {

	private logger = new Logger(CurrencyCategoryService.name);

	constructor(
		private readonly hanaCurrencyCategoryService: HanaCurrencyCategoryService,
		private readonly simpleFarmCurrencyCategoryService: SimpleFarmCurrencyCategoryService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
		const countNotIntegrated = await this.hanaCurrencyCategoryService.countNotIntegrated();
		const records = await this.hanaCurrencyCategoryService.getNotIntegrated();

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}
		try {
			if (records.length > 0){
				const category: CurrencyCategory = {
					Code: "GER",
					Description: "Geral",
					ShortName: "Geral",
					Currencies: records.map(r => { return { Symbol: r["Symbol"] } })
				};
				if (countNotIntegrated[0].QTDE === records.length){

					const responseObject = await this.simpleFarmCurrencyCategoryService.upsert(category);
					// const dataError = responseObject.Result.Data;
					for (const record of records){
						if (!responseObject.HasErrors){
							console.log('currency-category record', record);

							const responseCurrencyCatIntegrated = await this.hanaCurrencyCategoryService.setIntegrated(record);
							await this.logsService.logSuccess({
								key: record.Symbol, module: LogModule.CURRENCY_CATEGORY, requestObject: category, responseObject
							});
						}
						else{
							console.log('currency-category record Error', record);
							console.log('currency-category responseObject ERROR', responseObject);
							const criticalError = responseObject.Result.Data.CriticalError;
							if (!criticalError || criticalError === '') {
								// GATEC como encontrar uma moeda específica? Symbol?
								const errorMessages = _.find(_.get(responseObject, 'Result.Data.ErrorMessages', []), r => r['Item'] === record["Symbol"] );
								if (!errorMessages) {
									console.log('currency-category record errorMessages FALSE', record);
									const responseCurrencyCatIntegrated = await this.hanaCurrencyCategoryService.setIntegrated(record);
									await this.logsService.logSuccess({
										key: record.Symbol, module: LogModule.CURRENCY_CATEGORY, requestObject: category, responseObject
									});
								} 
								else{
									console.log('currency-category record errorMessages TRUE', record);

									const responseSetError = await this.hanaCurrencyCategoryService.setError(record);
									await this.hanaCurrencyCategoryService.updateRetry(record); // Retry faz sentido nesse contexto?
									await this.logsService.logError({ 
										key: record.Symbol, 
										module: LogModule.CURRENCY_CATEGORY, 
										exception: new Exception({
											code: 'SF002',
											message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
											request: category,
											response: errorMessages,
										}), 
									});
		
								}
							} 
							else {
								console.log('currency-category record criticalError TRUE', record);

								const responseSetError = await this.hanaCurrencyCategoryService.setError(record);
								await this.hanaCurrencyCategoryService.updateRetry(record); // Retry faz sentido nesse contexto?
								await this.logsService.logError({ 
									key: record.Symbol, 
									module: LogModule.CURRENCY_CATEGORY, 
									exception: new Exception({
										code: 'SF002',
										message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
										request: category,
										response: criticalError,
									}), 
								});

							}
						}
					}
				}
				else {
					console.log('currency-category record count ERROR', countNotIntegrated[0].QTDE);
					console.log('currency-category RECORDS count ERROR', records.length);
	
					for (const record of records){
						const responseSetError = await this.hanaCurrencyCategoryService.setError(record);
						await this.hanaCurrencyCategoryService.updateRetry(record);
						await this.logsService.logError({ 
							key: record.Symbol, 
							module: LogModule.CURRENCY_CATEGORY, 
							exception: new Exception({
								code: 'SF002',
								message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
								request: category,
								response: 'Divergência nos ítens. Favor reprocessar a categoria da moeda.',
							}), 
						});
					}
				}
			}
		}
		catch (exception) {
			for (const record of records){
				const responseSetError = await this.hanaCurrencyCategoryService.setError(record);
				await this.hanaCurrencyCategoryService.updateRetry(record);
				await this.logsService.logError({ key: record.Symbol, module: LogModule.CURRENCY_CATEGORY, exception });
			}
		}
		

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}

}