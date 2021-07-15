import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import * as _ from 'lodash';

@Injectable()
export class HanaInvoiceCanceledService extends DatabaseService<any> {

	async getNotIntegrated(): Promise<any> {

		const query = `
		SELECT
        1                   AS "nfCancelada",
        T4."KeyNfe"  AS "nfChave",
        T3."DocEntry"
      FROM
          ${this.databaseName}.OINV T3
      INNER JOIN ${this.databaseName}."Process" T4
             ON T4."DocEntry" = T3."DocEntry"
      WHERE
          T3."U_ALFA_Integrated" = 'Y'
      --AND T3."CANCELED" = 'C'
      AND T4."StatusId" = '10'
      AND T3."U_ALFA_pedidoId" != ''      
	  AND T3."U_ALFA_Retry" < 3
	  `;
	return await this.execute(query);
	}

	async setIntegrated(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OINV SET "U_ALFA_Integrated" = 'C' WHERE "DocEntry" = '${record["DocEntry"]}' `;
		console.log(query);
		return await this.execute(query);
	}

	async updateRetry(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OINV SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE  "DocEntry" = '${record["DocEntry"]}'`;
		return await this.execute(query);
	}
	
}
