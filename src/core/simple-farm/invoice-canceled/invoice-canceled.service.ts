import { Injectable, } from '@nestjs/common';
import { Invoice } from './interfaces';
import { SimpleFarmHttpService } from '../http/simple-farm-http.service';
import { SimpleFarmResponse } from '../http/interfaces/index';

@Injectable()
export class SimpleFarmCanceledInvoiceService {

	constructor(private readonly simpleFarmHttpService: SimpleFarmHttpService) { }

	async upsert(data: Invoice): Promise<SimpleFarmResponse> {
		return this.simpleFarmHttpService.post(`nfcancelamento`, data, true);
	}

}
