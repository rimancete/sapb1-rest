import { Injectable, } from '@nestjs/common';
import { AccountPayment } from './interfaces';
import { SimpleFarmHttpService } from '../http/simple-farm-http.service';
import { SimpleFarmResponse } from '../http/interfaces/index';

@Injectable()
export class SimpleFarmAccountPaymentService {

	constructor(private readonly simpleFarmHttpService: SimpleFarmHttpService) {}

	upsert(data: AccountPayment): Promise<SimpleFarmResponse> {
		return this.simpleFarmHttpService.post(`AccountPayment`, data, true);
	}

}

