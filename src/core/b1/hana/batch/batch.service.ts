import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import { LogModule, LogType } from '../../../../core/logs/interface';


@Injectable()
export class HanaBatchService extends DatabaseService<any> {

  async getNotIntegrated(): Promise<any> {

    const query = `
    
      SELECT   
          OBT."DistNumber"                AS "batchCode" 
        , OBT."ItemCode"                  AS "itemCode"
        , 'false'                         AS "isItemDefault"
        , Item."U_ALFA_Operation"         AS "producingUnitCode"
        , ''                              AS "projectCode" 
        , ''                              AS "periodCode"
        , OBT."MnfDate"                   AS "productionDate"
        , OBT."ExpDate"                   AS "expirationDate"
        , 'true'                          AS "active"   	
        FROM ${this.databaseName}.OBTN OBT

        INNER JOIN ${this.databaseName}.OITM Item
        ON OBT."ItemCode"  = Item."ItemCode" 
        AND Item."U_ALFA_Integrated" = 'Y'
        
        INNER JOIN ${this.databaseName}."@ALFA_SUBGROUP" Family 
        ON Item."U_ALFA_Subgroup" = Family."Code"
        AND Family."U_Integrated" = 'Y'

        INNER JOIN ${this.databaseName}.OITB ItemGroup 
        ON ItemGroup."ItmsGrpCod" = Item."ItmsGrpCod"
        AND ItemGroup."U_ALFA_Integrated" = 'Y'
        AND ItemGroup."U_ALFA_IntegracaoSF" = 'Y'
        

        WHERE 
            OBT."U_ALFA_Integrated" = 'N'
        AND OBT."U_ALFA_Retry" < 3
        AND OBT."ExpDate" IS NOT NULL
		`;

    return await this.execute(query);
  }

  async setIntegrated(record: any): Promise<DatabaseResponse<any>> {
    const query = `UPDATE ${this.databaseName}.OBTN ot SET ot."U_ALFA_Integrated" = 'Y' WHERE ot."DistNumber" = '${record.batchCode}' AND ot."ItemCode" = '${record.itemCode}' `;
    return await this.execute(query);
  }

  async updateRetry(record: any): Promise<DatabaseResponse<any>> {
    const query = `UPDATE ${this.databaseName}.OBTN ot SET ot."U_ALFA_Retry" = ot."U_ALFA_Retry" + 1 WHERE ot."DistNumber" = '${record.batchCode}' AND ot."ItemCode" = '${record.itemCode}'`;
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
