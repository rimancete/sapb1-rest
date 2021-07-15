import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import { CostCenter } from '../../../simple-farm/cost-center/interfaces'
import { LogModule, LogType } from '../../../../core/logs/interface';
import * as _ from 'lodash';

@Injectable()
export class HanaCostCenterService extends DatabaseService<any> {

	async getNotIntegrated(): Promise<CostCenter[]> {

		const query = `  
    SELECT 
      	CostCenter."PrcCode"                                                AS "Code"
    , 	CostCenter."PrcName"                                                AS "Description"
    , 	CostCenter."PrcName"                                                AS "ShortDescription"
    , 	(CASE WHEN CostCenter."Active" = 'Y' THEN 'true' ELSE 'false' END)  AS "Active"
    , 	null                                                                AS "ParentCode"
    , 	CostCenter."PrcCode"                                                AS "LevelCode"
    , 	'true'                                                             	AS "AcceptsEntry"
    , 	CostCenter."PrcCode"                                                AS "ShortCode"       
    FROM 
      ${this.databaseName}.OPRC CostCenter    
    WHERE 
	  		CostCenter."U_ALFA_Integrated" = 'N'
		AND	CostCenter."U_ALFA_Retry" < 3
		AND	CostCenter."DimCode" = 1
    `;
		return await this.execute(query);
	}

	async setIntegrated(record: CostCenter): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OPRC SET "U_ALFA_Integrated" = 'Y' WHERE "PrcCode" = '${record.Code}'`;
		return await this.execute(query);
	}

	async updateRetry(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OPRC SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE "PrcCode" = '${record.Code}'`;
		return await this.execute(query);
	}


	async getCostCenter(code: string): Promise<any> {
		const query = `SELECT 
                      "PrcCode" 
										, "U_Tipo" 
                    FROM 
                      ${this.databaseName}.OPRC 

                    WHERE 
                      "PrcCode" = '${code}'`;
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
    
      DECLARE TOTAL			INTEGER;
      DECLARE IMPORTED		INTEGER;
      DECLARE NOTIMPORTED		INTEGER;
      DECLARE PERCENTUAL		DECIMAL(18,2);
			DECLARE LAST_UPDATE		SECONDDATE;
      
      TOTAL := 0;
      IMPORTED := 0;
      PERCENTUAL := 0;
      
			SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OPRC WHERE "DimCode" = 1) INTO TOTAL FROM DUMMY;
			
			SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OPRC WHERE "U_ALFA_Integrated" = 'Y' AND "DimCode" = 1) INTO IMPORTED FROM DUMMY;
			
			SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OPRC WHERE "U_ALFA_Integrated" = 'N' AND "DimCode" = 1) INTO NOTIMPORTED FROM DUMMY;
			
			SELECT (SELECT MAX(LOGDATE) FROM ALFA_LOGS.LOGS WHERE "MODULE" = ${LogModule.COST_CENTER} AND "LOGTYPECODE" = ${LogType.SUCCESS}) INTO LAST_UPDATE FROM DUMMY;
			
			PERCENTUAL := (IMPORTED / TOTAL) * 100;
			
			SELECT 
				:TOTAL AS "Total", 
				:IMPORTED AS "Importadas",
				:NOTIMPORTED AS "NaoImportadas", 
				:PERCENTUAL AS "Percentual",
				:LAST_UPDATE AS "UltimaIntegracao"
			FROM DUMMY;
			
    END;
      `
		);
	}
}
