import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmItemPriceService } from '../../core/simple-farm/item-price/item-price.service';
import { HanaItemPriceService } from '../../core/b1/hana/item-price/item-price.service'
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Runner } from '../../core/runner';
import { Exception } from 'src/core/exception';

@Injectable()
export class ItemPriceService extends Runner {

	private logger = new Logger(ItemPriceService.name);

	constructor(
		private readonly hanaItemPriceService: HanaItemPriceService,
		private readonly simpleFarmItemPriceService: SimpleFarmItemPriceService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {

		const records = await this.hanaItemPriceService.getNotIntegrated();
		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}
		try{
			if(records.length > 0){
			for (const record of records) {
				const key = `${record["ItemCode"]}|${record["PriceDate"]}|${record["InventoryLocationCode"]}`;
				const responseObject = await this.simpleFarmItemPriceService.upsert(record);
				record["PriceDate"] = moment(record["PriceDate"], 'YYYY-MM-DD').format('YYYY-MM-DD')
				record["Price"] = [{ CurrencyIso: 986, Value: parseFloat(record["Price"]) }];
				if (!responseObject.HasErrors){
					console.log('item-price - record',record);
					const responseItemIntegrated = await this.hanaItemPriceService.setIntegrated(record["ItemCode"], record["PriceDate"], record["InventoryLocationCode"]);
					// console.log('item-price - responseItemIntegrated',responseItemIntegrated);
					await this.logsService.logSuccess({
						key, module: LogModule.ITEM_PRICE, requestObject: record, responseObject
					});
				}else{
					 await this.hanaItemPriceService.updateRetry(record["ItemCode"], record["PriceDate"], record["InventoryLocationCode"]);
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					 console.log('item-price - record WITH ERROR',record);
					 console.log('item-price - responseObject',responseObject);
					 console.log('item-price - responseObject CHECKERROR',
					 typeof errorMessages !== 'undefined' || errorMessages !== [] ? errorMessages : 
					 typeof criticalError !== 'undefined' || criticalError !== '' ? criticalError : 
					 typeof dataError === 'string' ? dataError : 'Erro desconhecido'
					 );
					 await this.logsService.logError({
					 	key,
					 	module: LogModule.ITEM_PRICE,
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
		}
	 	} catch (exception) {
			for (const record of records) {         
				console.log('item-price - exception', exception); 
				const key = `${record["ItemCode"]}|${record["PriceDate"]}|${record["InventoryLocationCode"]}`;
				record["PriceDate"] = moment(record["PriceDate"], 'YYYY-MM-DD').format('YYYY-MM-DD')
				await this.hanaItemPriceService.updateRetry(record["ItemCode"], record["PriceDate"], record["InventoryLocationCode"]);
				await this.logsService.logError({ key, module: LogModule.ITEM_PRICE, exception });
			}
		  }

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}


	}
}