import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import dayjs = require('dayjs');
import * as _ from 'lodash';

@Injectable()
export class HanaInvoiceAntecipationService extends DatabaseService<any> {

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
    SELECT DISTINCT
        T3."BPLId"                AS "empresa"
      FROM 
        ${this.databaseName}.ORDR T0  
  
      INNER JOIN ${this.databaseName}.RDR1 T1 
      ON T0."DocEntry" = T1."DocEntry" 
  
      INNER JOIN ${this.databaseName}.DPI1 T2
      ON T2."BaseType" = T1."ObjType" 
      AND T2."BaseEntry" = T1."DocEntry" 
  
      INNER JOIN ${this.databaseName}.ODPI T3 
      ON T2."DocEntry" = T3."DocEntry" 
  
      INNER JOIN ${this.databaseName}.DPI6 T4 
      ON T3."DocEntry" = T4."DocEntry" 
  
      INNER JOIN ${this.databaseName}.RCT2 T5 
      ON T5."InvType" = T4."ObjType" 
      AND T4."DocEntry" = T5."DocEntry" 
  
      INNER JOIN ${this.databaseName}.ORCT T6 
      ON T5."DocNum" = T6."DocEntry"
  
      WHERE
            T0."CreateDate" BETWEEN '${past}' AND '${today}'
      AND   T3."U_ALFA_Integrated"  = 'N'
      AND   T3.CANCELED = 'N'
      AND   T3."U_ALFA_pedidoId" != ''
      AND   T3."U_ALFA_Retry" < 3
    ) AS T1
      `;
		return await this.execute(query);
	}


	async getNotIntegrated(): Promise<any> {

    const days = await this.getConfigParamsDays();
    const today = dayjs().format('YYYY-MM-DD');
    const past = dayjs().subtract(parseInt(days.data[0].Day), 'day').format('YYYY-MM-DD');

		const query = `
    SELECT DISTINCT
      T3."BPLId"                AS "empresa",
      T0."U_ALFA_pedidoId"      AS "idPedido",
      T6."DocNum"               AS "numTitulo",
      T6."TaxDate"              AS "dataPagto",
      T6."DocTotal"             AS "valorPagto",
      T6."DocRate"              AS "ptaxPagto",
      T4."InstlmntID"           AS "seqFctoFinanERP",
      T3."DocNum"
    FROM 
      ${this.databaseName}.ORDR T0  

    INNER JOIN ${this.databaseName}.RDR1 T1 
    ON T0."DocEntry" = T1."DocEntry" 

    INNER JOIN ${this.databaseName}.DPI1 T2
    ON T2."BaseType" = T1."ObjType" 
    AND T2."BaseEntry" = T1."DocEntry" 

    INNER JOIN ${this.databaseName}.ODPI T3 
    ON T2."DocEntry" = T3."DocEntry" 

    INNER JOIN ${this.databaseName}.DPI6 T4 
    ON T3."DocEntry" = T4."DocEntry" 

    INNER JOIN ${this.databaseName}.RCT2 T5 
    ON T5."InvType" = T4."ObjType" 
    AND T4."DocEntry" = T5."DocEntry" 

    INNER JOIN ${this.databaseName}.ORCT T6 
    ON T5."DocNum" = T6."DocEntry"

    WHERE 
          T0."CreateDate" BETWEEN '${past}' AND '${today}'
    AND   T3."U_ALFA_Integrated"  = 'N'
    AND   T3.CANCELED = 'N'
    AND   T3."U_ALFA_pedidoId" != ''
    AND   T3."U_ALFA_Retry" < 3
    `;
    //console.log('invoice-antecipation', query);
		return await this.execute(query);
	}

	async setIntegrated(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.ODPI SET "U_ALFA_Integrated" = 'Y' WHERE "DocNum" = '${record.DocNum}'`;
		return await this.execute(query);
  }
  
  async setError(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.ODPI SET "U_ALFA_Integrated" = 'E' WHERE "DocNum" = '${record.DocNum}'`;
		return await this.exec(query);
	  }

	async updateRetry(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.ODPI SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE "DocNum" = '${record.DocNum}'`;
		return await this.execute(query);
	}
	
}
