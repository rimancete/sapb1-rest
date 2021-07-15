import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import { LogModule, LogType } from '../../../../core/logs/interface';


@Injectable()
export class HanaTransactionService extends DatabaseService<any> {

	async countNotIntegrated(): Promise<any[]>{
		const query = `
		SELECT COUNT("Code") AS "QTDE"
		FROM
		(
		SELECT 
			T0."ID"                   AS  "Code"
		FROM 
			${this.databaseName}.OUSG T0 
		WHERE 
			(T0."Usage" LIKE 'Venda%' OR  T0."Usage" LIKE 'NF%')
		AND T0."U_ALFA_Integrated" = 'N'
		AND T0."U_ALFA_Retry" < 3 ---
		ORDER BY 
			T0."ID"
		) AS T1	`;
		return await this.execute(query);
	}

	async getNotIntegrated(): Promise<any> {

    const query = `
      SELECT 
          T0."ID"                   AS  "Code"
        , T0."Usage"                AS  "Description"
        , SUBSTR(T0."Descr",0,20)   AS  "ShortName"
        , ''                        AS  "TransactionType"
        , ''                        AS  "Active" 
      FROM 
        ${this.databaseName}.OUSG T0 
      WHERE 
          (T0."Usage" LIKE 'Venda%' OR  T0."Usage" LIKE 'NF%')
      AND T0."U_ALFA_Integrated" = 'N'
	  AND T0."U_ALFA_Retry" < 3 ---
      ORDER BY 
        T0."ID"  
		`;

	return await this.execute(query);
	}

	async setIntegrated(record: any): Promise<DatabaseResponse<any>> {
    const query = `UPDATE ${this.databaseName}.OUSG SET "U_ALFA_Integrated" = 'Y' WHERE "ID" = ${record.Code}`;
		return await this.execute(query);
	}

	async setError(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OUSG SET "U_ALFA_Integrated" = 'E' WHERE "ID" = ${record.Code}`;
		return await this.execute(query);
		}

	async updateRetry(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OUSG SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE "Code" = '${record.Code}'`;
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
      
			SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OBTN) INTO TOTAL FROM DUMMY;
			
			SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OBTN WHERE "U_ALFA_Integrated" = 'Y') INTO IMPORTED FROM DUMMY;
			
			SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OBTN WHERE "U_ALFA_Integrated" = 'N') INTO NOTIMPORTED FROM DUMMY;
			
			SELECT (SELECT MAX(LOGDATE) FROM ALFA_LOGS.LOGS WHERE "MODULE" = ${LogModule.BATCH} AND "LOGTYPECODE" = ${LogType.SUCCESS}) INTO LAST_UPDATE FROM DUMMY;
    
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
