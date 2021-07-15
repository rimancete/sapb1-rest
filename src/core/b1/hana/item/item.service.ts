import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import * as _ from 'lodash';

@Injectable()
export class HanaItemService extends DatabaseService<any> {

	getNotIntegrated(): Promise<any[]> {

		return this.execute(`
  
SELECT 
Item."ItemCode"                                               		AS "Code"
, Company."BPLId"			        	                                AS "CompanyCode"
, Item."ItemName"                                               		AS "Description"
, Item."FrgnName"                                               		AS "ShortDescription" 
, CAST(Family."Code" AS NVARCHAR )                              		AS "FamilyCode"
, CAST(Item."ItmsGrpCod" AS NVARCHAR )                          		AS "GroupCode"
, (CASE WHEN Item."validFor" = 'Y' THEN true else false END)   			AS "Active"
, IFNULL(UnitMeasurementWithgroup."UomCode", Item."InvntryUom")	        AS "UnitCode"
, IFNULL(UnitMeasurementWithgroup."UomCode", Item."InvntryUom")	        AS "UnitApplicationCode"
, (CASE WHEN Item."ItemClass" = 1 THEN 2 ELSE 1 END)            		AS "Type"
, (CASE WHEN Item."ItemClass" = 1 THEN 3 
      ELSE (CASE WHEN Item."InvntItem" = 'Y' THEN 1 ELSE 2 END) 
END)                                                          AS "TypeControl"
, Item."SuppCatNum"                                             AS "ManufacturerCode"

FROM ${this.databaseName}.OITM Item 

INNER JOIN ${this.databaseName}."@ALFA_SUBGROUP" Family 
ON Item."U_ALFA_Subgroup" = Family."Code"
AND Family."U_Integrated" = 'Y'

INNER JOIN ${this.databaseName}.OITB ItemGroup 
ON ItemGroup."ItmsGrpCod" = Item."ItmsGrpCod"
AND ItemGroup."U_ALFA_Integrated" = 'Y'
AND ItemGroup."U_ALFA_IntegracaoSF" = 'Y'


LEFT JOIN ${this.databaseName}.OUGP UnitMeasurementGroup
ON Item."UgpEntry" = UnitMeasurementGroup."UgpEntry"
AND Item."UgpEntry" <> -1

LEFT JOIN ${this.databaseName}.OUOM UnitMeasurementWithgroup
ON UnitMeasurementWithgroup."UomEntry" = Item."IUoMEntry"
AND UnitMeasurementWithgroup."U_ALFA_Integrated" = 'Y'
AND Item."UgpEntry" <> -1
  
LEFT JOIN ${this.databaseName}.OUOM UnitMeasurement  
ON UnitMeasurement."UomCode" = Item."InvntryUom"
AND UnitMeasurement."U_ALFA_Integrated" = 'Y'
    
INNER JOIN ${this.databaseName}.OBPL Company
ON Company."U_ALFA_Integrated" = 'Y'
AND Company."MainBPL" = 'Y'    

WHERE
  Item."U_ALFA_Integrated" = 'N'
AND Item."U_ALFA_Retry" < 3
AND ((Item."UgpEntry" <> -1 AND UnitMeasurementWithgroup."UomCode" IS NOT NULL) OR 
  (Item."UgpEntry" = -1 AND UnitMeasurement."UomCode" IS NOT NULL))
	`);

	}

	async setIntegrated(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OITM SET "U_ALFA_Integrated" = 'Y' WHERE "ItemCode" = '${record.Code}'`;
		return await this.execute(query);
  }
    
	async updateRetry(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OITM SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE "ItemCode" = '${record.Code}'`;
		return await this.execute(query);
	}

	async getItem(code: string): Promise<any> {

		// const query = `SELECT 
    //                 item."ItemCode" ,
    //                 precoitem."Price"
    //               FROM 
    //                 ${this.databaseName}.OITM item
    //               INNER JOIN ${this.databaseName}."@ALFA_CONFIG" config
    //               ON 1 = 1
    //               LEFT JOIN ${this.databaseName}.ITM1 precoitem
    //               ON precoitem."ItemCode" = item."ItemCode"
    //               AND precoitem."PriceList" = config."U_ALFA_PriceList"
                  
    //               WHERE 
    //                 item."ItemCode" = '${code}'`;
    const query = `SELECT 
                    "ItemCode" 
                  FROM 
                    ${this.databaseName}.OITM 
                  WHERE 
                    "ItemCode" = '${code}'`;
		try {
			const result = await this.exec(query);
			return _.first(result.data);
		} catch (exception) {
			return null;
		}
	}

	getIntegrationValues(): Promise<DatabaseResponse<any>> {

		return this.exec(`
    DO
    BEGIN
    
      DECLARE TOTAL_BRANCH	INTEGER;
      DECLARE IMPORTED		INTEGER;
      DECLARE NOTIMPORTED		INTEGER;
      DECLARE PERCENTUAL		DECIMAL(18,2);
      
      TOTAL_BRANCH := 0;
      IMPORTED := 0;
      PERCENTUAL := 0;
      
    SELECT (SELECT COUNT(*) FROM ${this.databaseName}."OITM" INNER JOIN ${this.databaseName}."OITB" ON ("OITM"."ItmsGrpCod" = "OITB"."ItmsGrpCod")
    WHERE "OITM"."InvntryUom" IS NOT NULL AND "OITB"."ItmsGrpCod" = 117) INTO TOTAL_BRANCH FROM DUMMY;
    
    SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OITM INNER JOIN ${this.databaseName}."OITB" ON ("OITM"."ItmsGrpCod" = "OITB"."ItmsGrpCod")
    WHERE "OITM"."U_ALFA_Integrated" = 'Y' AND OITM."InvntryUom" IS NOT NULL AND "OITB"."ItmsGrpCod" = 117) INTO IMPORTED FROM DUMMY;
    
    SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OITM INNER JOIN ${this.databaseName}."OITB" ON ("OITM"."ItmsGrpCod" = "OITB"."ItmsGrpCod")
    WHERE "OITM"."U_ALFA_Integrated" = 'N' AND "OITM"."InvntryUom" IS NOT NULL AND "OITB"."ItmsGrpCod" = 117) INTO NOTIMPORTED FROM DUMMY;
    
    PERCENTUAL := (IMPORTED / TOTAL_BRANCH) * 100;
    
    SELECT 
      :TOTAL_BRANCH AS "Total", 
      :IMPORTED AS "Importadas",
      :NOTIMPORTED AS "NaoImportadas", 
      :PERCENTUAL AS "Percentual" 
    FROM DUMMY;
    
    END;
    
		  `
		);
	}
}
