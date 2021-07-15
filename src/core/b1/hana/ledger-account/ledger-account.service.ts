import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HanaLedgerAccountService extends DatabaseService<any> {

  getNotIntegrated(): Promise<any[]> {
    const query = (`   
    SELECT 
    A."AcctCode" 
    ,A."AcctName" 
    ,A."Levels" 
    FROM ${this.databaseName}.OACT A
    WHERE A."Levels"  = 5
    `);
    

    return this.execute(query);
  }

  setIntegrated(record: any): Promise<DatabaseResponse<any>> {
    const inquery = `UPDATE ${this.databaseName}.${record.Table} SET "U_ALFA_Integrated" = 'Y' WHERE "AcctCode" = ${record.Code}`
    return this.exec(inquery);
  }

  setError(record: any): Promise<DatabaseResponse<any>> {
    const upquery = `UPDATE ${this.databaseName}.${record.Table} SET "U_ALFA_Integrated" = 'E' WHERE "AcctCode" = ${record.Code}`
    return this.exec(upquery);
  }




}
