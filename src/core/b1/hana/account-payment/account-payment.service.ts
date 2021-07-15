import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HanaAccountPaymentService extends DatabaseService<any> {

  getNotIntegrated(): Promise<any[]> {
    const query = (`   
    SELECT 
    DISTINCT 
    'PCH1' "Table"
    ,A."DocNum" 
    ,A."CardCode"
    ,A."BPLId" 
    ,A."DocDate"
    ,A."DocTotal"
    ,C."OcrCode" 
    ,D."U_ALFA_Filial"
    ,E."Account" 
    ,E."Debit"
    ,A."Canceled"
    FROM ${this.databaseName}.OVPM A
    INNER JOIN ${this.databaseName}.VPM2 B ON (A."DocEntry" = B."DocNum")
    LEFT JOIN ${this.databaseName}.PCH1 C ON (B."DocEntry" = C."DocEntry" )
    INNER JOIN ${this.databaseName}.OPCH D ON (C."DocEntry" = D."DocEntry")
    LEFT JOIN ${this.databaseName}.JDT1 E ON (B."DocTransId" = E."TransId" AND B."DocLine" = E."Line_ID")
    WHERE 
    B."InvType" = 18
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
