import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import { LogModule, LogType } from '../../../../core/logs/interface';
import * as _ from 'lodash';

@Injectable()
export class HanaDownPaymentService extends DatabaseService<any> {

	async getPayment(orderId): Promise<any> {
		const query = `  
						SELECT 
						"CardCode",
						"DocEntry",
						"BPLId"       
						FROM 
						${this.databaseName}.ORDR 
						WHERE
						"DocEntry" = '${orderId}'
    `;
    return await this.execute(query);
	}
}