import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HanaLedgerAccountValueService extends DatabaseService<any> {

  getNotIntegrated(): Promise<any[]> {
    const query = (`   
    SELECT 
    'JDT1' "Table"
    ,A."BPLId"
    ,C."BPLName"
    ,A."ProfitCode"
    ,A."RefDate" 
    ,A."Debit" 
    ,A."Credit" 
    ,B."TransType" 
    ,A."Account" 
    ,D."AcctName"
    ,A."ContraAct"
    ,E."AcctName"
    FROM ${this.databaseName}.JDT1 A
    INNER JOIN ${this.databaseName}.OJDT B ON (A."TransId" = B."TransId")
    INNER JOIN ${this.databaseName}.OBPL C ON (A."BPLId" = C."BPLId")
    LEFT JOIN ${this.databaseName}.OACT D ON (A."Account" = D."AcctCode")
    LEFT JOIN ${this.databaseName}.OACT E ON (A."ContraAct" = E."AcctCode")
    `);

    return this.execute(query);
  }

  setIntegrated(record: any): Promise<DatabaseResponse<any>> {

    const query = `
      UPDATE  
          ${this.databaseName}.${record.table} 
      SET 
        "${record.Status == 'Reserva cancelada' ? 'U_ALFA_IntegratedCancel' : 'U_ALFA_Integrated'}" = 'Y' 
      WHERE  "DocEntry" = ${record.DocEntry}
    `;
    return this.exec(query);
  }

  updateRetry(record: any): Promise<DatabaseResponse<any>> {
    const query = `UPDATE  ${this.databaseName}.${record.table} SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE  "DocNum" = ${record.SolReqNum} AND "U_ALFA_RequestNumber" = ${record.IdKey}`;
    return this.exec(query);
  }




}
