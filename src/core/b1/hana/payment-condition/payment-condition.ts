import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';
import { LogModule, LogType } from '../../../logs/interface';
import { Contract } from 'src/core/simple-farm/contract/interfaces';
import * as _ from 'lodash';

@Injectable()
export class HanaPaymentConditionService extends DatabaseService<any> {

	async getNotIntegrated(): Promise<any> {

		const query = `
		SELECT 
        PAYMENT."GroupNum",
        PAYMENT."PymntGroup",
        PAYMENT."PymntGroup",
        false AS "FixedDay",
        false AS "Anticipated",
        3 AS "Type",
        true AS "Active" 
    FROM 
      ${this.databaseName}.OCTG PAYMENT
    WHERE
        "U_ALFA_Integrated" = 'N' 
    AND "U_ALFA_Retry" < 3          
    `;
    
    return await this.execute(query);
    
	}

	async getNotIntegratedInstallments(GroupNum): Promise<any> {

		const query = `
    SELECT
      INSTALLMENTS."CTGCode",
      INSTALLMENTS."IntsNo",
      INSTALLMENTS."InstPrcnt",
      INSTALLMENTS."InstDays"
    FROM 
      ${this.databaseName}.CTG1 INSTALLMENTS
    WHERE 
      INSTALLMENTS."CTGCode" = '${GroupNum}'
		`;
		return await this.execute(query);
	}



	async setIntegrated(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OCTG SET "U_ALFA_Integrated" = 'Y' WHERE "GroupNum" = '${record.GroupNum}'`;
		return await this.execute(query);
	}

	async updateRetry(record: any): Promise<DatabaseResponse<any>> {
		const query = `UPDATE ${this.databaseName}.OCTG SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE "GroupNum" = '${record.GroupNum}'`;
		return await this.execute(query);
	}

}
