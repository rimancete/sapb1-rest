import { Injectable, } from '@nestjs/common';
import { InvoiceReturn } from './interfaces';
import { SimpleFarmHttpService } from '../http/simple-farm-http.service';
import { SimpleFarmResponse } from '../http/interfaces/index';

@Injectable()
export class SimpleFarmReturnInvoiceService {

	constructor(private readonly simpleFarmHttpService: SimpleFarmHttpService) { }

	async upsert(data: InvoiceReturn): Promise<SimpleFarmResponse> {
		return this.simpleFarmHttpService.post(`nfretorno`, data, true);
	}

}
