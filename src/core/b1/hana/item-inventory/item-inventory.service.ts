import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import { ItemInventory } from './interfaces';

@Injectable()
export class HanaItemInventoryService extends DatabaseService<any> {
	async countNotIntegrated(): Promise<any[]>{
		const query = `
		SELECT COUNT("CompanyCode") AS "QTDE"
		FROM
		(
		SELECT
			Company."BPLId"																AS 	"CompanyCode"
			
		FROM
			${this.databaseName}."OIVL" Journal
			
			INNER JOIN ${this.databaseName}."OITM" Item
			ON Item."ItemCode" = Journal."ItemCode"
			AND Item."U_ALFA_Integrated" = 'Y'
                      
      INNER JOIN ${this.databaseName}."@ALFA_SUBGROUP" Family 
      ON Item."U_ALFA_Subgroup" = Family."Code"
      AND Family."U_Integrated" = 'Y'

      INNER JOIN ${this.databaseName}.OITB ItemGroup 
      ON ItemGroup."ItmsGrpCod" = Item."ItmsGrpCod"
      AND ItemGroup."U_ALFA_Integrated" = 'Y'
      AND ItemGroup."U_ALFA_IntegracaoSF" = 'Y'
      

			INNER JOIN ${this.databaseName}."OWHS" Warehouse
			ON Warehouse."WhsCode" = Journal."LocCode"
			AND Warehouse."U_ALFA_Integrated" = 'Y'
		
			INNER JOIN ${this.databaseName}."OBPL" Branch
			ON Warehouse."BPLid" = Branch."BPLId"
			AND Branch."U_ALFA_Integrated" = 'Y'
		
			INNER JOIN ${this.databaseName}."OBPL" Company
			ON Company."U_ALFA_Integrated" = 'Y'
			AND Company."MainBPL" = 'Y'
			
			LEFT JOIN ${this.databaseName}."OWHS" ReserveWarehouse
			ON ReserveWarehouse."WhsCode" = Warehouse."U_ALFA_ReserveWhs"
		
			INNER JOIN 
				(
					SELECT DISTINCT
						"ItemCode", 
						IFNULL(OriginalOWHS."WhsCode",PendingOIVL."LocCode") AS "LocCode"
					FROM
						${this.databaseName}."OIVL" PendingOIVL
								
						LEFT JOIN ${this.databaseName}."OWHS" OriginalOWHS
						ON OriginalOWHS."U_ALFA_ReserveWhs" = PendingOIVL."LocCode"
						
					WHERE
						PendingOIVL."U_ALFA_Integrated" = 'N' ) JournalPending
			ON JournalPending."ItemCode" = Journal."ItemCode"
			AND JournalPending."LocCode" = Journal."LocCode"										
		
		WHERE
			Journal."LocType" = 64
		AND Item."ManBtchNum" = 'N'
		
		GROUP BY
			Company."BPLId",
			Branch."BPLId",
			Journal."ItemCode",
			Warehouse."WhsCode",
			ReserveWarehouse."WhsCode"
			
		UNION ALL
		
		SELECT
			Company."BPLId"										AS 	"CompanyCode"
			
		FROM
			${this.databaseName}."OITL" Journal
								
			LEFT JOIN ${this.databaseName}."ITL1" JournalItem
			ON JournalItem."LogEntry" = Journal."LogEntry"
			
			LEFT JOIN ${this.databaseName}."OBTN" BatchNumber
      ON BatchNumber."SysNumber" = JournalItem."SysNumber"			
		  AND BatchNumber."ItemCode" = JournalItem."ItemCode"
			
			INNER JOIN 
				(
					SELECT DISTINCT
						J."ItemCode", 
						IFNULL(OriginalOWHS."WhsCode",J."LocCode") AS "LocCode",
						I."SysNumber"
					FROM
						${this.databaseName}."OITL" J
						
						INNER JOIN ${this.databaseName}."ITL1" I
						ON I."LogEntry" = J."LogEntry"				
						
						LEFT JOIN ${this.databaseName}."OWHS" OriginalOWHS
						ON OriginalOWHS."U_ALFA_ReserveWhs" = J."LocCode"
						
					WHERE
						I."U_ALFA_Integrated" = 'N'
					AND	I."U_ALFA_Retry" < 3
						) JournalPending
			ON JournalPending."ItemCode" = Journal."ItemCode"
			AND JournalPending."LocCode" = Journal."LocCode"	
			AND JournalPending."SysNumber" = JournalItem."SysNumber"	
				
			INNER JOIN ${this.databaseName}."OITM" Item
			ON Item."ItemCode" = Journal."ItemCode"
			AND Item."U_ALFA_Integrated" = 'Y'
		
			INNER JOIN ${this.databaseName}."OWHS" Warehouse
			ON Warehouse."WhsCode" = Journal."LocCode"
			AND Warehouse."U_ALFA_Integrated" = 'Y'	
				
			INNER JOIN ${this.databaseName}."OBPL" Branch
			ON Warehouse."BPLid" = Branch."BPLId"
			AND Branch."U_ALFA_Integrated" = 'Y'
		
			INNER JOIN ${this.databaseName}."OBPL" Company
			ON Company."U_ALFA_Integrated" = 'Y'
      AND Company."MainBPL" = 'Y'
            
            
      INNER JOIN ${this.databaseName}."@ALFA_SUBGROUP" Family 
      ON Item."U_ALFA_Subgroup" = Family."Code"
      AND Family."U_Integrated" = 'Y'

      INNER JOIN ${this.databaseName}.OITB ItemGroup 
      ON ItemGroup."ItmsGrpCod" = Item."ItmsGrpCod"
      AND ItemGroup."U_ALFA_Integrated" = 'Y'
      AND ItemGroup."U_ALFA_IntegracaoSF" = 'Y'

      LEFT JOIN ${this.databaseName}."OWHS" ReserveWarehouse
			ON ReserveWarehouse."WhsCode" = Warehouse."U_ALFA_ReserveWhs"
			
			
		WHERE
				Journal."LocType" = 64
    AND Item."ManBtchNum" = 'Y'
    AND BatchNumber."U_ALFA_Integrated" = 'Y'
		
		GROUP BY
			Company."BPLId",
			Branch."BPLId",
			Journal."ItemCode",
			Warehouse."WhsCode",
			BatchNumber."DistNumber",
			ReserveWarehouse."WhsCode") AS T1										

		`;
		return await this.execute(query);
	}
	async getNotIntegrated(): Promise<ItemInventory[]> {

		const query = (`
		SELECT
			Company."BPLId"																AS 	"CompanyCode",
			Branch."BPLId" 																AS	"SubsidiaryCode",
			Journal."ItemCode"														AS	"ItemCode",		  
			SUM(Journal."InQty") - SUM(Journal."OutQty")	AS 	"Quantity",
			Warehouse."WhsCode"														AS	"InventoryLocationCode",
			IFNULL((SELECT 
						SUM(JournalReserve."InQty") - SUM(JournalReserve."OutQty")
					FROM
						${this.databaseName}."OIVL" JournalReserve	 	
					WHERE
						JournalReserve."ItemCode" = Journal."ItemCode"
					AND ReserveWarehouse."WhsCode" = JournalReserve."LocCode"),0)	
																										AS	"ReservedQuantity",
			null																					AS	"Location",
			null																					AS	"ItemDerivationCode",
      null																					AS	"ItemBatchCode",
      ReserveWarehouse."WhsCode"                    AS  "ReserveWarehouse"
		FROM
			${this.databaseName}."OIVL" Journal
			
			INNER JOIN ${this.databaseName}."OITM" Item
			ON Item."ItemCode" = Journal."ItemCode"
			AND Item."U_ALFA_Integrated" = 'Y'
                      
      INNER JOIN ${this.databaseName}."@ALFA_SUBGROUP" Family 
      ON Item."U_ALFA_Subgroup" = Family."Code"
      AND Family."U_Integrated" = 'Y'

      INNER JOIN ${this.databaseName}.OITB ItemGroup 
      ON ItemGroup."ItmsGrpCod" = Item."ItmsGrpCod"
      AND ItemGroup."U_ALFA_Integrated" = 'Y'
      AND ItemGroup."U_ALFA_IntegracaoSF" = 'Y'
      

			INNER JOIN ${this.databaseName}."OWHS" Warehouse
			ON Warehouse."WhsCode" = Journal."LocCode"
			AND Warehouse."U_ALFA_Integrated" = 'Y'
		
			INNER JOIN ${this.databaseName}."OBPL" Branch
			ON Warehouse."BPLid" = Branch."BPLId"
			AND Branch."U_ALFA_Integrated" = 'Y'
		
			INNER JOIN ${this.databaseName}."OBPL" Company
			ON Company."U_ALFA_Integrated" = 'Y'
			AND Company."MainBPL" = 'Y'
			
			LEFT JOIN ${this.databaseName}."OWHS" ReserveWarehouse
			ON ReserveWarehouse."WhsCode" = Warehouse."U_ALFA_ReserveWhs"
		
			INNER JOIN 
				(
					SELECT DISTINCT
						"ItemCode", 
						IFNULL(OriginalOWHS."WhsCode",PendingOIVL."LocCode") AS "LocCode"
					FROM
						${this.databaseName}."OIVL" PendingOIVL
								
						LEFT JOIN ${this.databaseName}."OWHS" OriginalOWHS
						ON OriginalOWHS."U_ALFA_ReserveWhs" = PendingOIVL."LocCode"
						
					WHERE
						PendingOIVL."U_ALFA_Integrated" = 'N' ) JournalPending
			ON JournalPending."ItemCode" = Journal."ItemCode"
			AND JournalPending."LocCode" = Journal."LocCode"										
		
		WHERE
			Journal."LocType" = 64
		AND Item."ManBtchNum" = 'N'
		
		GROUP BY
			Company."BPLId",
			Branch."BPLId",
			Journal."ItemCode",
			Warehouse."WhsCode",
			ReserveWarehouse."WhsCode"
			
		UNION ALL
		
		SELECT
			Company."BPLId"										AS 	"CompanyCode",
			Branch."BPLId" 										AS	"SubsidiaryCode",
			Journal."ItemCode"									AS	"ItemCode",		  
			SUM(JournalItem."Quantity")							AS 	"Quantity",
			Warehouse."WhsCode"									AS	"InventoryLocationCode",	
			0													AS	"ReservedQuantity",
			null												AS	"Location",
			null												AS	"ItemDerivationCode",
      BatchNumber."DistNumber"							AS	"ItemBatchCode",      
      ReserveWarehouse."WhsCode"                    AS  "ReserveWarehouse"
		FROM
			${this.databaseName}."OITL" Journal
								
			LEFT JOIN ${this.databaseName}."ITL1" JournalItem
			ON JournalItem."LogEntry" = Journal."LogEntry"
			
			LEFT JOIN ${this.databaseName}."OBTN" BatchNumber
      ON BatchNumber."SysNumber" = JournalItem."SysNumber"			
		  AND BatchNumber."ItemCode" = JournalItem."ItemCode"
			
			INNER JOIN 
				(
					SELECT DISTINCT
						J."ItemCode", 
						IFNULL(OriginalOWHS."WhsCode",J."LocCode") AS "LocCode",
						I."SysNumber"
					FROM
						${this.databaseName}."OITL" J
						
						INNER JOIN ${this.databaseName}."ITL1" I
						ON I."LogEntry" = J."LogEntry"				
						
						LEFT JOIN ${this.databaseName}."OWHS" OriginalOWHS
						ON OriginalOWHS."U_ALFA_ReserveWhs" = J."LocCode"
						
					WHERE
						I."U_ALFA_Integrated" = 'N'
					AND	I."U_ALFA_Retry" < 3
						) JournalPending
			ON JournalPending."ItemCode" = Journal."ItemCode"
			AND JournalPending."LocCode" = Journal."LocCode"	
			AND JournalPending."SysNumber" = JournalItem."SysNumber"	
				
			INNER JOIN ${this.databaseName}."OITM" Item
			ON Item."ItemCode" = Journal."ItemCode"
			AND Item."U_ALFA_Integrated" = 'Y'
		
			INNER JOIN ${this.databaseName}."OWHS" Warehouse
			ON Warehouse."WhsCode" = Journal."LocCode"
			AND Warehouse."U_ALFA_Integrated" = 'Y'	
				
			INNER JOIN ${this.databaseName}."OBPL" Branch
			ON Warehouse."BPLid" = Branch."BPLId"
			AND Branch."U_ALFA_Integrated" = 'Y'
		
			INNER JOIN ${this.databaseName}."OBPL" Company
			ON Company."U_ALFA_Integrated" = 'Y'
      AND Company."MainBPL" = 'Y'
            
            
      INNER JOIN ${this.databaseName}."@ALFA_SUBGROUP" Family 
      ON Item."U_ALFA_Subgroup" = Family."Code"
      AND Family."U_Integrated" = 'Y'

      INNER JOIN ${this.databaseName}.OITB ItemGroup 
      ON ItemGroup."ItmsGrpCod" = Item."ItmsGrpCod"
      AND ItemGroup."U_ALFA_Integrated" = 'Y'
      AND ItemGroup."U_ALFA_IntegracaoSF" = 'Y'

      LEFT JOIN ${this.databaseName}."OWHS" ReserveWarehouse
			ON ReserveWarehouse."WhsCode" = Warehouse."U_ALFA_ReserveWhs"
			
			
		WHERE
				Journal."LocType" = 64
    AND Item."ManBtchNum" = 'Y'
    AND BatchNumber."U_ALFA_Integrated" = 'Y'
		
		GROUP BY
			Company."BPLId",
			Branch."BPLId",
			Journal."ItemCode",
			Warehouse."WhsCode",
			BatchNumber."DistNumber",
			ReserveWarehouse."WhsCode"										
    `);
	return await this.execute(query);
	}

	async setIntegrated(record: ItemInventory): Promise<void> {

		if (record.ItemBatchCode) {

			return await this.execute(`
				UPDATE 
					${this.databaseName}.ITL1 JournalItem
				SET
					"U_ALFA_Integrated" = 'Y'
				FROM
					${this.databaseName}."OITL" Journal
								
					LEFT JOIN ${this.databaseName}."ITL1" JournalItem
					ON JournalItem."LogEntry" = Journal."LogEntry"
					
					LEFT JOIN ${this.databaseName}."OBTN" BatchNumber
					ON BatchNumber."SysNumber" = JournalItem."SysNumber"	

				WHERE 
						JournalItem."U_ALFA_Integrated" = 'N'
				AND Journal."ItemCode" = '${record.ItemCode}'
				AND (Journal."LocCode" = '${record.InventoryLocationCode}' OR Journal."LocCode" = '${record.ReserveWarehouse}')
				AND BatchNumber."DistNumber" = '${record.ItemBatchCode}'
			`);

		} else {

			return await this.execute(`
				UPDATE 
					${this.databaseName}.OIVL Journal
				SET
					"U_ALFA_Integrated" = 'Y'
				WHERE 
						Journal."U_ALFA_Integrated" = 'N'
				AND Journal."ItemCode" = '${record.ItemCode}'
				AND (Journal."LocCode" = '${record.InventoryLocationCode}' OR Journal."LocCode" = '${record.ReserveWarehouse}')
			`);

		}

	}

	async setError(record: ItemInventory): Promise<void> {

		if (record.ItemBatchCode) {

			return await this.execute(`
				UPDATE 
					${this.databaseName}.ITL1 JournalItem
				SET
					"U_ALFA_Integrated" = 'E'
				FROM
					${this.databaseName}."OITL" Journal
								
					LEFT JOIN ${this.databaseName}."ITL1" JournalItem
					ON JournalItem."LogEntry" = Journal."LogEntry"
					
					LEFT JOIN ${this.databaseName}."OBTN" BatchNumber
					ON BatchNumber."SysNumber" = JournalItem."SysNumber"	

				WHERE 
						JournalItem."U_ALFA_Integrated" = 'N'
				AND Journal."ItemCode" = '${record.ItemCode}'
				AND (Journal."LocCode" = '${record.InventoryLocationCode}' OR Journal."LocCode" = '${record.ReserveWarehouse}')
				AND BatchNumber."DistNumber" = '${record.ItemBatchCode}'
			`);

		} else {

			return await this.execute(`
				UPDATE 
					${this.databaseName}.OIVL Journal
				SET
					"U_ALFA_Integrated" = 'E'
				WHERE 
						Journal."U_ALFA_Integrated" = 'N'
				AND Journal."ItemCode" = '${record.ItemCode}'
				AND (Journal."LocCode" = '${record.InventoryLocationCode}' OR Journal."LocCode" = '${record.ReserveWarehouse}')
			`);

		}

	}

	async updateRetry(record: ItemInventory): Promise<void> {

		if (record.ItemBatchCode) {

			return await this.execute(`
				UPDATE 
					${this.databaseName}.ITL1 JournalItem
				SET
          JournalItem."U_ALFA_Retry" = JournalItem."U_ALFA_Retry" + 1
				FROM
					${this.databaseName}."OITL" Journal
								
					LEFT JOIN ${this.databaseName}."ITL1" JournalItem
					ON JournalItem."LogEntry" = Journal."LogEntry"
					
					LEFT JOIN ${this.databaseName}."OBTN" BatchNumber
					ON BatchNumber."SysNumber" = JournalItem."SysNumber"	

				WHERE 
						JournalItem."U_ALFA_Integrated" = 'N'
				AND Journal."ItemCode" = '${record.ItemCode}'
				AND Journal."LocCode" = '${record.InventoryLocationCode}'
				AND BatchNumber."DistNumber" = '${record.ItemBatchCode}'
			`);

		} else {

			return await this.execute(`
				UPDATE 
					${this.databaseName}.OIVL Journal
				SET
        Journal."U_ALFA_Retry" = Journal."U_ALFA_Retry" + 1
				WHERE 
						Journal."U_ALFA_Integrated" = 'N'
				AND Journal."ItemCode" = '${record.ItemCode}'
				AND Journal."LocCode" = '${record.InventoryLocationCode}'
			`);

		}

	}


	async getIntegrationValues(): Promise<DatabaseResponse<any>> {

		return await this.exec(`
		DO
		BEGIN
		
			DECLARE TOTAL			INTEGER;
			DECLARE IMPORTED		INTEGER;
			DECLARE NOTIMPORTED		INTEGER;
			DECLARE PERCENTUAL		DECIMAL(18,2);
			
			TOTAL := 0;
			IMPORTED := 0;
			PERCENTUAL := 0;
			
		SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OIVL WHERE "LocType" = 64) INTO TOTAL FROM DUMMY;
		
		SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OIVL WHERE "U_ALFA_Integrated" = 'Y' AND "LocType" = 64) INTO IMPORTED FROM DUMMY;
		
		SELECT (SELECT COUNT(*) FROM ${this.databaseName}.OIVL WHERE "U_ALFA_Integrated" = 'N' AND "LocType" = 64) INTO NOTIMPORTED FROM DUMMY;
		
		PERCENTUAL := (IMPORTED / TOTAL) * 100;
		
		SELECT 
			:TOTAL AS "Total", 
			:IMPORTED AS "Importadas",
			:NOTIMPORTED AS "NaoImportadas", 
			:PERCENTUAL AS "Percentual" 
		FROM DUMMY;
		
		END;
		  `
		);
	}



}
