import { Injectable, } from '@nestjs/common';
import { Invoice } from './interfaces';
import { SimpleFarmHttpService } from '../http/simple-farm-http.service';
import { SimpleFarmResponse } from '../http/interfaces/index';

@Injectable()
export class SimpleFarmInvoiceAntecipationService {

	constructor(private readonly simpleFarmHttpService: SimpleFarmHttpService) { }

	async upsert(data: any,dataBaixa: any): Promise<SimpleFarmResponse> {

		await  this.simpleFarmHttpService.post(`antecipacaoparcela`, data, true);
		return this.simpleFarmHttpService.post(`antecipacaobaixa`, dataBaixa, true);
	}

}
