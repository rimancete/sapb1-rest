import { Injectable, } from '@nestjs/common';
import { AccountOrigin } from './interfaces';
import { SimpleFarmHttpService } from '../http/simple-farm-http.service';
import { SimpleFarmResponse } from '../http/interfaces/index';

@Injectable()
export class SimpleFarmAccountOriginService {

	constructor(private readonly simpleFarmHttpService: SimpleFarmHttpService) {}

	upsert(data: AccountOrigin): Promise<SimpleFarmResponse> {
		return this.simpleFarmHttpService.post(`AccountOrigin`, data, true);
	}

}

