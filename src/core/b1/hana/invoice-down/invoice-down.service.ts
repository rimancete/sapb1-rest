import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import * as _ from 'lodash';
import dayjs = require('dayjs');

@Injectable()
export class HanaInvoiceDownService extends DatabaseService<any> {

  async getConfigParamsDays():Promise<any>{
    const query = `    
    SELECT 
        top 1 IFNULL("U_day",30) AS "Day"
    FROM 
    ${this.databaseName}."@ALFA_CONF_DIAS_INT"
    `;
    return await this.exec(query);

  }

  async countNotIntegrated(): Promise<any[]> {
    const days = await this.getConfigParamsDays();
    const today = dayjs().format('YYYY-MM-DD');
    const past = dayjs().subtract(parseInt(days.data[0].Day), 'day').format('YYYY-MM-DD');
    
    const query = `
    SELECT 
    COUNT(*) AS "QTDE"
  FROM
    (
      SELECT 
      oi."BPLId"            AS "empresa"
    FROM 
      ${this.databaseName}.RCT2 r2	
      
    INNER JOIN ${this.databaseName}.OINV oi
    ON r2."DocEntry" = oi."DocEntry" 

    INNER JOIN ${this.databaseName}.INV6 i6
    ON oi."DocEntry" = i6."DocEntry"                  	
      
    INNER JOIN ${this.databaseName}.ORCT ot
    ON ot."DocEntry" = r2."DocNum" 
      
    WHERE 
        oi."CreateDate" BETWEEN '${past}' AND '${today}'
    AND r2."U_ALFA_Integrated" = 'N'
    AND ot."Canceled" = 'N' 
    AND oi."U_ALFA_pedidoId" != ''
    AND oi."U_ALFA_Retry" < 3    
    ) AS T1
    `;
		return await this.execute(query);
  }

	async getNotIntegrated(): Promise<any> {


    const days = await this.getConfigParamsDays();
    const today = dayjs().format('YYYY-MM-DD');
    const past = dayjs().subtract(parseInt(days.data[0].Day), 'day').format('YYYY-MM-DD');

    const query = `
    SELECT 
      oi."BPLId"            AS "empresa"
    , oi."Serial"			      AS "nfNumero"
    , oi."U_ChaveAcesso"		AS "nfChave"
    , i6."InstlmntID"		    AS "parParcela"
    , ot."DocNum" 			    AS "seqPagamento"
    , ot."TaxDate" 			    AS "dataPagto"
    , ot."DocTotal" 			  AS "valorPagto"
    , '1.0'				          AS "ptaxPagto"
    , 0						          AS "seqFctoFinanErp"
    , oi."DocEntry" 
    FROM 
      ${this.databaseName}.RCT2 r2	
      
    INNER JOIN ${this.databaseName}.OINV oi
    ON r2."DocEntry" = oi."DocEntry" 

    INNER JOIN ${this.databaseName}.INV6 i6
    ON oi."DocEntry" = i6."DocEntry"                  	
      
    INNER JOIN ${this.databaseName}.ORCT ot
    ON ot."DocEntry" = r2."DocNum" 
      
    WHERE 
        oi."CreateDate" BETWEEN '${past}' AND '${today}'
    AND r2."U_ALFA_Integrated" = 'N'
    AND ot."Canceled" = 'N' 
    AND oi."U_ALFA_pedidoId" != ''
    AND oi."U_ALFA_Retry" < 3    
						 		                      
    `;
    //console.log('invoice-down', query);
    return await this.execute(query);
	}

	async setIntegrated(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.RCT2 SET "U_ALFA_Integrated" = 'Y' WHERE "DocEntry" = '${record.DocEntry}' `;
		return await this.execute(query);
  }
  
  async setError(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.RCT2 SET "U_ALFA_Integrated" = 'E' WHERE "DocEntry" = '${record.DocEntry}' `;
		return await this.execute(query);
	}


	async updateRetry(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OINV SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE "DocNum" = '${record.seqPagamento}'`;
		return await this.execute(query);
	}
	
}
