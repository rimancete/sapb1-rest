import { Injectable, } from '@nestjs/common';
import { CurrencyQuote } from './interfaces';
import { SimpleFarmHttpService } from '../http/simple-farm-http.service';
import { SimpleFarmResponse } from '../http/interfaces/index';

@Injectable()
export class SimpleFarmCurrencyQuoteService {

	constructor(private readonly simpleFarmHttpService: SimpleFarmHttpService) {}

	upsert(data: CurrencyQuote): Promise<SimpleFarmResponse> {
		return this.simpleFarmHttpService.post(`CurrencyQuote`, data, true);
	}

}
