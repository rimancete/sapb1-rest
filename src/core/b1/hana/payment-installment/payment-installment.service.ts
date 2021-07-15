import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HanaPaymentInstallmentService extends DatabaseService<any> {

  getNotIntegrated(): Promise<any[]> {
    const query = (`   
    SELECT 
    A."GroupNum" AS  "PaymentCondutionCode"
    ,B."IntsNo" AS "Sequence"
    ,B."InstPrcnt" AS "PercentValue"
    ,B."InstDays" AS "Days"
    FROM ${this.databaseName}.OCTG A
    INNER JOIN ${this.databaseName}.CTG1 B ON A."GroupNum" = B."CTGCode"
    
    --WHERE 
    --B."U_ALFA_IntegratedMovement" = 'N'
    
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
