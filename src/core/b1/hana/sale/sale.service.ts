import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import { LogModule, LogType } from '../../../logs/interface';
import { Contract } from 'src/core/simple-farm/contract/interfaces';
import * as _ from 'lodash';

@Injectable()
export class HanaSaleService extends DatabaseService<any> {

	async getOrder(id: string): Promise<any> {

		const query = `
		SELECT 	
			"DocEntry",
			"BPLId",
			"Comments",
			"DocDate",
			"DocDueDate",
			"Ref2" ,
			"CardCode",
			"Email" ,
			"U_ALFA_RequestNumber"
		FROM ${this.databaseName}.ORDR
		WHERE
			"DocEntry" = '${id}'
		
		 		                      
		`;
		return await this.execute(query);
	}

	async getItems(id: string): Promise<any> {

      const itens = `
					  SELECT 
						"OcrCode",
						"ItemCode"
					  FROM ${this.databaseName}.RDR1 
					  WHERE "DocEntry" = '${id}'
					`;
		return await this.execute(itens);
	}

}
