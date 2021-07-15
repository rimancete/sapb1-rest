import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import * as _ from 'lodash';

@Injectable()
export class HanaInvoiceDownDeleteService extends DatabaseService<any> {

  async countNotIntegrated(): Promise<any[]> {
    
    const query = `
      SELECT
        COUNT(*) AS "QTDE"
      FROM
        (
          SELECT 
          oi."BPLId"             AS "empresa"
      FROM 
      ${this.databaseName}.RCT2 r2	
      INNER JOIN 
      ${this.databaseName}.OINV oi
      ON 
      r2."DocEntry" = oi."DocEntry" 
      INNER JOIN 
      ${this.databaseName}.INV6 i6
      ON
        oi."DocEntry" = i6."DocEntry"                  	
      INNER JOIN 
          ${this.databaseName}.ORCT ot
      ON 
        ot."DocEntry"  = r2."DocNum" 
      WHERE 
        r2."U_ALFA_Integrated" = 'N'
      AND 
        ot."Canceled" = 'Y' 	
      AND 
        oi."U_ALFA_pedidoId" != ''
      AND
        oi."U_ALFA_Retry" < 3 		                      
) AS T1
    `;
		return await this.execute(query);
  }


  async getNotIntegrated(): Promise<any> {

		const query = `
                      SELECT 
                          oi."BPLId"             AS "empresa"
                          ,oi."U_ChaveAcesso"		AS "nfChave"
                          ,i6."InstlmntID"		AS "parParcela"                         
                          ,oi."DocEntry" 
                      FROM 
                      ${this.databaseName}.RCT2 r2	
                      INNER JOIN 
                      ${this.databaseName}.OINV oi
                      ON 
                      r2."DocEntry" = oi."DocEntry" 
                      INNER JOIN 
                      ${this.databaseName}.INV6 i6
                      ON
                        oi."DocEntry" = i6."DocEntry"                  	
                      INNER JOIN 
                          ${this.databaseName}.ORCT ot
                      ON 
                        ot."DocEntry"  = r2."DocNum" 
                      WHERE 
                        r2."U_ALFA_Integrated" = 'N'
                      AND 
                        ot."Canceled" = 'Y' 	
                      AND 
                      	oi."U_ALFA_pedidoId" != ''
                      AND
                        oi."U_ALFA_Retry" < 3 		                      
		`;
		return await this.execute(query);
	}

	async setIntegrated(record: any): Promise<DatabaseResponse<any>> {
    // const query = `UPDATE ${this.databaseName}.OINV SET "U_ALFA_Integrated" = 'Y' WHERE "DocNum" = '${record.DocNum}' AND "U_chaveacesso" = '${record.nfChave}' `;
    const query = `UPDATE ${this.databaseName}.RCT2 SET "U_ALFA_Integrated" = 'Y' WHERE "DocEntry" = '${record.DocEntry}' `;
		return await this.execute(query);
	}

  async setError(record: any): Promise<DatabaseResponse<any>> {
    const query = `UPDATE ${this.databaseName}.RCT2 SET "U_ALFA_Integrated" = 'E' WHERE "DocEntry" = '${record.DocEntry}' `;
		return await this.execute(query);
	}


	async updateRetry(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OINV SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE "DocNum" = '${record.DocNum}' AND "U_ChaveAcesso" = '${record.nfChave}'`;
		return await this.execute(query);
	}
	
}
