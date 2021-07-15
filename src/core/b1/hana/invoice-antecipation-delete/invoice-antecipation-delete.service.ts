import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import * as _ from 'lodash';

@Injectable()
export class HanaInvoiceAntecipationDeleteService extends DatabaseService<any> {

	async getNotIntegrated(): Promise<any> {

		const query = `
    SELECT 
      DOWN."BPLId"                  AS "empresa"
    , DOWN."U_ALFA_pedidoId"        AS "idPedido"
    , DOWN."DocNum"                 AS "numPedido"
    , '0'                           AS "parParcela"
    FROM ${this.databaseName}.ODPI DOWN

    INNER JOIN ${this.databaseName}.ORCT PAYMENT
    ON DOWN."DocEntry"  = PAYMENT."DocEntry" 

    WHERE 
        DOWN."U_ALFA_Integration" = 'N'
    AND DOWN."U_ALFA_Retry"  < 3
    AND PAYMENT."Canceled" = 'Y'
    AND DOWN."U_ALFA_pedidoId" != ''			 		                      
		`;
		return await this.execute(query);
	}

	async setIntegrated(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.ODPI SET "U_ALFA_Integrated" = 'Y' WHERE "DocNum" = '${record.numPedido}'`;
		return await this.execute(query);
	}

	async updateRetry(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.ODPI SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE "DocNum" = '${record.numPedido}'`;
		return await this.execute(query);
	}
	
}
