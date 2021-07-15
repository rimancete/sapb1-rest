import { Injectable, } from '@nestjs/common';
import { LedgerAccountValue } from './interfaces';
import { SimpleFarmHttpService } from '../http/simple-farm-http.service';
import { SimpleFarmResponse } from '../http/interfaces/index';

@Injectable()
export class SimpleFarmLedgerAccountValueService {

	constructor(private readonly simpleFarmHttpService: SimpleFarmHttpService) {}

	upsert(data: LedgerAccountValue): Promise<SimpleFarmResponse> {
		return this.simpleFarmHttpService.post(`AccountValue`, data, true);
	}

}

