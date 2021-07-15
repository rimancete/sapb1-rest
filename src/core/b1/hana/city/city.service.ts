import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import { LogModule, LogType } from '../../../../core/logs/interface';


@Injectable()
export class HanaCityService extends DatabaseService<any> {

	async getNotIntegrated(): Promise<any> {

		const query = `
      SELECT
        City."Code"
      , City."Name" 
      , City."State"    AS "StateCode"                                            
      FROM ${this.databaseName}.OCNT City

      INNER JOIN ${this.databaseName}.OCST UF
      ON UF."Code" = City."State" 
      AND UF."U_ALFA_Integrated" = 'Y'

      WHERE
		City."U_ALFA_Integrated" = 'N'
	  AND City."U_ALFA_Retry" < 3
		`;

		return await this.execute(query);
	}

	async setIntegrated(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OCNT SET "U_ALFA_Integrated" = 'Y' WHERE "Code" = '${record.Code}'`;
		return await this.execute(query);
	}

	async updateRetry(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OCNT SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE "Code" = '${record.Code}'`;
		return await this.execute(query);
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
      
			SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OCNT) INTO TOTAL FROM DUMMY;
			
			SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OCNT WHERE "U_ALFA_Integrated" = 'Y') INTO IMPORTED FROM DUMMY;
			
			SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OCNT WHERE "U_ALFA_Integrated" = 'N') INTO NOTIMPORTED FROM DUMMY;
			
			SELECT (SELECT MAX(LOGDATE) FROM ALFA_LOGS.LOGS WHERE "MODULE" = ${LogModule.CITY} AND "LOGTYPECODE" = ${LogType.SUCCESS}) INTO LAST_UPDATE FROM DUMMY;
    
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
