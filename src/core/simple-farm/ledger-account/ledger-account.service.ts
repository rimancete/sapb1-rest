import { Injectable, } from '@nestjs/common';
import { LedgerAccount } from './interfaces';
import { SimpleFarmHttpService } from '../http/simple-farm-http.service';
import { SimpleFarmResponse } from '../http/interfaces/index';

@Injectable()
export class SimpleFarmLedgerAccountService {

	constructor(private readonly simpleFarmHttpService: SimpleFarmHttpService) {}

	upsert(data: LedgerAccount): Promise<SimpleFarmResponse> {
		return this.simpleFarmHttpService.post(`Account`, data, true);
	}

}

