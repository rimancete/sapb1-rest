import { Injectable, } from '@nestjs/common';
import { PaymentInstallment } from './interfaces';
import { SimpleFarmHttpService } from '../http/simple-farm-http.service';
import { SimpleFarmResponse } from '../http/interfaces/index';

@Injectable()
export class SimpleFarmPaymentInstallmentService {

	constructor(private readonly simpleFarmHttpService: SimpleFarmHttpService) {}

	upsert(data: PaymentInstallment): Promise<SimpleFarmResponse> {
		return this.simpleFarmHttpService.post(`PaymentInstallment`, data, true);
	}

}

