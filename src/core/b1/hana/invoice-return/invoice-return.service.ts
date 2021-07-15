import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import * as _ from 'lodash';
import dayjs = require('dayjs');

@Injectable()
export class HanaInvoiceReturnService extends DatabaseService<any> {

  getRandomNum(length) {
    const randomNum = 
        (Math.pow(10,length).toString().slice(length-1) + 
        Math.floor((Math.random()*Math.pow(10,length))+1).toString()).slice(-length);
    return randomNum;
}

  async getConfigParamsDays():Promise<any>{
    const query = `    
    SELECT 
        top 1 IFNULL("U_day",30) AS "Day"
    FROM 
    ${this.databaseName}."@ALFA_CONF_DIAS_INT"
    `;

    return await this.exec(query);

  }

  async countNotIntegrated(): Promise<any> {

    const days = await this.getConfigParamsDays();
    const today = dayjs().format('YYYY-MM-DD');
    const past = dayjs().subtract(parseInt(days.data[0].Day), 'day').format('YYYY-MM-DD');

		const query = `
    SELECT COUNT("nFNumero") AS "QTDE"
		FROM
		(                  
          SELECT DISTINCT
            T3."Serial"   			        AS "nFNumero"
          FROM 
            ${this.databaseName}."ORDR"  T0 
                
          INNER JOIN ${this.databaseName}."RDR1"  T1 
            ON T0."DocEntry" = T1."DocEntry" 

          INNER JOIN ${this.databaseName}.INV1 T2 
            ON  T2."BaseType" = T1."ObjType" 
            AND T2."BaseEntry" = T1."DocEntry"  
            AND  T2."BaseLine" = T1."LineNum"
          
          INNER JOIN ${this.databaseName}.OINV T3 
          ON T2."DocEntry" = T3."DocEntry"

          INNER JOIN ${this.databaseName}."Process" T4
          ON T3."DocEntry" = T4."DocEntry"
              
          WHERE
              T0."CreateDate" BETWEEN '${past}' AND '${today}'
          AND T3."U_ALFA_Integrated"  = 'N'
          AND T3."U_ALFA_Retry" < 3	
          AND T3."CANCELED" = 'N'
          AND T3."U_ALFA_pedidoId" != ''
          AND T4."DocType" = '13'
          AND T4."StatusId" = '4'
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
      T3."Serial"   			        AS "nFNumero"
    , T3."BPLId"    			        AS "Empresa"
    , T3."TaxDate"  			        AS "nfData"
    , T3."DocTotal"      		      AS "nfValor"
    , T0."U_ALFA_pedidoId"        AS "idPedido"
    , (SELECT MAX("Usage") FROM ${this.databaseName}.INV1 i WHERE i."DocEntry" = T3."DocEntry") AS "transacao"
    , T3."Weight" 			          AS "nfPeso"
    , T3."DocEntry"
    , T3."DocNum"
    , T4."KeyNfe"       		      AS "nfChave"
    , 0						                AS "nfTipo"
    , 'NFS' 					            AS "especDocto"
    , T3."SeriesStr" 			        AS "serie"
    , '10245'						          AS "emitente"
    , T3."U_ALFA_RequestNumber"		AS "nfRomaneio"
    , 0						                AS "vlImpostoPerc"	
    , 0                           AS "vlImpostoPeso"
    , 0						                AS "dscImposto"
    , 0 					                AS "nfPesoBruto"
    , T3."DocNum"
    , CURDATE() 		 AS "nfDataDigit"
    FROM 
      ${this.databaseName}."ORDR"  T0 
          
    INNER JOIN ${this.databaseName}."RDR1"  T1 
      ON T0."DocEntry" = T1."DocEntry" 

    INNER JOIN ${this.databaseName}.INV1 T2 
      ON  T2."BaseType" = T1."ObjType" 
      AND T2."BaseEntry" = T1."DocEntry"  
      AND  T2."BaseLine" = T1."LineNum"
    
    INNER JOIN ${this.databaseName}.OINV T3 
    ON T2."DocEntry" = T3."DocEntry"

    INNER JOIN ${this.databaseName}."Process" T4
    ON T3."DocEntry" = T4."DocEntry"
         
    WHERE
        T0."CreateDate" BETWEEN '${past}' AND '${today}'
    AND T3."U_ALFA_Integrated"  = 'N'
    AND T3."U_ALFA_Retry" < 3	
    AND T3."CANCELED" = 'N'
    AND T3."U_ALFA_pedidoId" != ''
    AND T4."DocType" = '13'
    AND T4."StatusId" = '4'
    
    `;
    //console.log('invoice-return',query);
		return await this.execute(query);
	}

	async getParcel(record) : Promise<any> {
    
		const query = `
                    SELECT 
                          inv."InstlmntID"    AS "Parcela"
                        ,oi."U_ALFA_VencimentoNF"		 AS "Vencimento"
                        ,inv."InsTotal"		 AS "valor"
                      FROM ${this.databaseName}.INV6 inv
                      INNER JOIN ${this.databaseName}.OINV oi
                      ON inv."DocEntry" = oi."DocEntry"
                      WHERE inv."DocEntry" = '${record.DocEntry}'
		`
		return await this.execute(query);
	}

	async setIntegrated(record: any): Promise<DatabaseResponse<any>> {
    const query = `UPDATE ${this.databaseName}.OINV SET "U_ALFA_Integrated" = 'Y' WHERE "DocNum" = '${record.DocNum}' `;
		return await this.execute(query);
	}

  async setError(record: any): Promise<DatabaseResponse<any>> {
    const query = `UPDATE ${this.databaseName}.OINV SET "U_ALFA_Integrated" = 'E' WHERE "DocNum" = '${record.DocNum}' `;
		return await this.execute(query);
	}


	async updateRetry(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OINV SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE "DocNum" = '${record.DocNum}' AND "U_ChaveAcesso" = '${record.nfChave}'`;
		return await this.execute(query);
	}
	
}
