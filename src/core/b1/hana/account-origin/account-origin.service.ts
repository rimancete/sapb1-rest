import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HanaAccountOriginService extends DatabaseService<any> {

  getNotIntegrated(): Promise<any[]> {
    const query = (`   
      SELECT
      'OJDT' "Table"
      ,A."TransType"
      ,A."TransId"
      FROM ${this.databaseName}.OJDT A
      ORDER BY A."TransId" DESC
    `);

    return this.execute(query);
  }

  setIntegrated(record: any): Promise<DatabaseResponse<any>> {
    const query = `
      UPDATE  
          ${this.databaseName}.${record.table}
      SET 
        "${record.Status == 'Reserva cancelada' ? 'U_ALFA_IntegratedCancel' : 'U_ALFA_Integrated'}" = 'Y' 
      WHERE  "TransId" = ${record.TransId}
    `;
    return this.exec(query);
  }

  updateRetry(record: any): Promise<DatabaseResponse<any>> {
    const query = `UPDATE  ${this.databaseName}.${record.table} SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE  "DocNum" = ${record.SolReqNum} AND "U_ALFA_RequestNumber" = ${record.IdKey}`;
    return this.exec(query);
  }




}
