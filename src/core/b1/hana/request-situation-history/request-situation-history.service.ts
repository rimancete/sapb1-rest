import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HanaRequestSituationHistoryService extends DatabaseService<any> {
  async countNotIntegrated(): Promise<any[]> {
    const query = (`  
    SELECT COUNT("SolReqNum") AS "QTDE"
		FROM
		(
		      SELECT    
		        Draft."DocEntry" 							          AS "SolReqNum"
		      FROM 
		      ${this.databaseName}.OWTR ReserveTransfer
		      
		      INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
		      ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
		        
		      INNER JOIN ${this.databaseName}.ODRF Draft 
		      ON Draft."ObjType" = 67
		      AND ReserveTransfer."draftKey" = Draft."DocEntry"   
		        
		      WHERE 
		          ReserveTransferItem."U_ALFA_Integrated" = 'N'
		      AND ReserveTransferItem."U_ALFA_Retry" < 3 ---
		      AND Draft."U_ALFA_RequestNumber" IS NOT NULL
		      
		      UNION 
		
		      SELECT    
		        Draft."DocEntry" 							          AS "SolReqNum"
		      FROM 
		      ${this.databaseName}.OWTR ReserveTransfer
		      
		      INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
		      ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
		        
		      INNER JOIN ${this.databaseName}.ODRF Draft 
		      ON Draft."ObjType" = 67
		      AND ReserveTransfer."draftKey" = Draft."DocEntry"   
		        
		      WHERE
		          ReserveTransferItem."U_ALFA_Integrated" = 'Y'
		      AND ReserveTransferItem."U_ALFA_IntegratedCancel" = 'N'
		      AND ReserveTransferItem."U_ALFA_Retry" < 3 ---
		      AND Draft."U_ALFA_RequestNumber" IS NOT NULL
		      AND ReserveTransfer."CANCELED" = 'Y'
		      
		      UNION 
		
		      SELECT    
		        ReserverTransferRequest."DocEntry"      AS "SolReqNum"
		      FROM 
		      ${this.databaseName}.OWTR ReserveTransfer
		      
		      INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
		      ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
		        
		      INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
		      ON  ReserveTransferItem."BaseEntry" = ReserverTransferRequestItem."DocEntry" 
		      AND ReserveTransferItem."BaseLine" = ReserverTransferRequestItem."LineNum" 
		      AND ReserveTransferItem."BaseType" = 1250000001
		
		      INNER JOIN ${this.databaseName}.OWTQ ReserverTransferRequest
		      ON ReserverTransferRequestItem."DocEntry" = ReserverTransferRequest."DocEntry"
		        
		      WHERE 
		          ReserveTransferItem."U_ALFA_Integrated" = 'N'
		      AND ReserveTransferItem."U_ALFA_Retry" < 3 ---
		      AND ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL
		      
		      UNION 
		
		      SELECT    
		        ReserverTransferRequest."DocEntry"      AS "SolReqNum"
		      FROM 
		        ${this.databaseName}.OWTR ReserveTransfer
		      
		      INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
		      ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
		        
		      INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
		      ON  ReserveTransferItem."BaseEntry" = ReserverTransferRequestItem."DocEntry" 
		      AND ReserveTransferItem."BaseLine" = ReserverTransferRequestItem."LineNum" 
		      AND ReserveTransferItem."BaseType" = 1250000001
		      
		      INNER JOIN ${this.databaseName}.OWTQ ReserverTransferRequest
		      ON ReserverTransferRequestItem."DocEntry" = ReserverTransferRequest."DocEntry"
		        
		      WHERE 
		          ReserveTransferItem."U_ALFA_Integrated" = 'Y'
		      AND ReserveTransferItem."U_ALFA_IntegratedCancel" = 'N'
		      AND ReserveTransferItem."U_ALFA_Retry" < 3 ---
		      AND ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL
		      AND ReserveTransfer."CANCELED" = 'Y'
		      
		      UNION 
		
		      SELECT    
		        ReserverTransferRequest."DocEntry"      		    AS "SolReqNum"
		      FROM   
		        ${this.databaseName}.OWTQ ReserverTransferRequest
		            
		        INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
		        ON ReserverTransferRequest."DocEntry" = ReserverTransferRequestItem."DocEntry"   
		      
		        LEFT JOIN ${this.databaseName}.WTR1 ReserveTransferItem
		        ON ReserveTransferItem."BaseEntry" = ReserverTransferRequestItem."DocEntry" 
		        AND ReserveTransferItem."BaseLine" = ReserverTransferRequestItem."LineNum" 
		        AND ReserveTransferItem."BaseType" = 1250000001
		        
		      WHERE       
		            ReserverTransferRequestItem."U_ALFA_IntegratedCancel" = 'N'
		      AND	ReserverTransferRequestItem."U_ALFA_Retry" < 3 ---
		      AND 	ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL
		      AND 	ReserverTransferRequestItem."LineStatus" = 'C'
		      AND 	ReserveTransferItem."DocEntry" IS NULL
		  
		      UNION
		      
		      SELECT    
		        Draft."DocEntry" 							            AS "SolReqNum"
		      FROM 
		        ${this.databaseName}.OIGE ReserveOut
		      
		      INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
		      ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
		            
		      
		      INNER JOIN ${this.databaseName}.OWTR ReserveTransfer
		      ON ReserveTransfer."U_ALFA_RequestNumber" = ReserveOut."U_ALFA_RequestNumber"   
		            
		      INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
		      ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
		      AND ReserveTransferItem."ItemCode" = ReserveOutItem."ItemCode"
		            
		      INNER JOIN ${this.databaseName}.ODRF Draft 
		      ON Draft."ObjType" = 67
		      AND ReserveTransfer."draftKey" = Draft."DocEntry"  
		        
		      WHERE 
		          ReserveOutItem."U_ALFA_Integrated" = 'N'
		      AND ReserveOutItem."U_ALFA_Retry" < 3 ---
		      AND Draft."U_ALFA_RequestNumber" IS NOT NULL
		
		      UNION 
		      
		      SELECT    
		        ReserverTransferRequest."DocEntry"        AS "SolReqNum"
		      FROM 
		        ${this.databaseName}.OIGE ReserveOut
		      
		      INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
		      ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
		            
		      INNER JOIN ${this.databaseName}.OWTR ReserveTransfer
		      ON ReserveTransfer."U_ALFA_RequestNumber" = ReserveOut."U_ALFA_RequestNumber"   
		            
		      INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
		      ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
		      AND ReserveTransferItem."ItemCode" = ReserveOutItem."ItemCode"
		      
		      INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
		      ON ReserverTransferRequestItem."TargetType" = 67
		      AND ReserveTransfer."DocEntry" = ReserverTransferRequestItem."TrgetEntry"   
		      
		      INNER JOIN ${this.databaseName}.OWTQ ReserverTransferRequest
		      ON ReserverTransferRequestItem."DocEntry" = ReserverTransferRequest."DocEntry"
		        
		      WHERE 
		          ReserveOutItem."U_ALFA_Integrated" = 'N'
		      AND ReserveOutItem."U_ALFA_Retry" < 3 ---
		      AND ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL
		
		      UNION
		
		      SELECT    
		        Draft."DocEntry" 							          AS "SolReqNum"
		      FROM 
		      ${this.databaseName}.OIGN ReserveIn
		      
		      INNER JOIN ${this.databaseName}.IGN1 ReserveInItem
		      ON ReserveIn."DocEntry" = ReserveInItem."DocEntry"
		        
		      INNER JOIN ${this.databaseName}.ODRF Draft 
		      ON Draft."ObjType" = 59
		      AND ReserveIn."draftKey" = Draft."DocEntry"   
		        
		      WHERE 
		          ReserveInItem."U_ALFA_Integrated" = 'N'
		      AND ReserveInItem."U_ALFA_Retry" < 3 ---
		      AND Draft."U_ALFA_RequestNumber" IS NOT NULL
		            
		      UNION
		
		      SELECT 
		        PurchaseRequestOrder."DocNum"               AS "SolReqNum"
		      FROM 
		        ${this.databaseName}.OPRQ PurchaseRequestOrder
		
		        INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
		        ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"
		
		      WHERE 
		          PurchaseRequestOrderItem."U_ALFA_Integrated" = 'N'
		      AND PurchaseRequestOrderItem."U_ALFA_Retry" < 3 ---
		      AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL
		      AND PurchaseRequestOrder."CANCELED" = 'Y'
		
		      UNION
		
		      SELECT 
		        PurchaseRequestOrder."DocNum"               AS "SolReqNum"
		      FROM 
		        ${this.databaseName}.OPQT PurchaseQuotation
		
		        INNER JOIN ${this.databaseName}.PQT1 PurchaseQuotationItem
		        ON PurchaseQuotationItem."DocEntry"  = PurchaseQuotation."DocEntry"
		
		        INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
		        ON PurchaseRequestOrderItem."DocEntry"  = PurchaseQuotationItem."BaseEntry"
		        AND PurchaseRequestOrderItem ."LineNum"  = PurchaseQuotationItem."BaseLine" 
		
		        INNER JOIN ${this.databaseName}.OPRQ PurchaseRequestOrder
		        ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"
		
		      WHERE 
		          PurchaseQuotationItem."U_ALFA_Integrated" = 'N'
		      AND PurchaseQuotationItem."U_ALFA_Retry" < 3 ---
		      AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL
		
		      UNION
		
		      SELECT 
		        PurchaseRequestOrder."DocNum"               AS "SolReqNum"
		      FROM 
		        ${this.databaseName}.OPOR PurchaseOrder
		
		        INNER JOIN ${this.databaseName}.POR1 PurchaseOrderItem
		        ON PurchaseOrderItem."DocEntry"  = PurchaseOrder."DocEntry"
		        
		        INNER JOIN ${this.databaseName}.PQT1 PurchaseQuotationItem
		        ON PurchaseQuotationItem."DocEntry"  = PurchaseOrderItem."BaseEntry"
		        AND PurchaseQuotationItem ."LineNum"  = PurchaseOrderItem."BaseLine" 
		
		        INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
		        ON PurchaseRequestOrderItem."DocEntry"  = PurchaseQuotationItem."BaseEntry"
		        AND PurchaseRequestOrderItem ."LineNum"  = PurchaseQuotationItem."BaseLine" 
		
		        INNER JOIN ${this.databaseName}.OPRQ PurchaseRequestOrder
		        ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"
		
		      WHERE 
		          PurchaseOrderItem."U_ALFA_Integrated" = 'N'
		      AND PurchaseOrderItem."U_ALFA_Retry" < 3 ---
		      AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL
		
		      UNION 
		
		      SELECT 
		        PurchaseRequestOrder."DocNum"               AS "SolReqNum"
		      FROM 
		        ${this.databaseName}.OPCH PurchaseInvoice
		
		        INNER JOIN ${this.databaseName}.PCH1 PurchaseInvoiceItem
		        ON PurchaseInvoiceItem."DocEntry"  = PurchaseInvoice."DocEntry"
		
		        INNER JOIN ${this.databaseName}.POR1 PurchaseOrderItem
		        ON PurchaseOrderItem."DocEntry"  = PurchaseInvoiceItem."BaseEntry"
		        AND PurchaseOrderItem ."LineNum"  = PurchaseInvoiceItem."BaseLine" 
		        
		        INNER JOIN ${this.databaseName}.PQT1 PurchaseQuotationItem
		        ON PurchaseQuotationItem."DocEntry"  = PurchaseOrderItem."BaseEntry"
		        AND PurchaseQuotationItem ."LineNum"  = PurchaseOrderItem."BaseLine" 
		
		        INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
		        ON PurchaseRequestOrderItem."DocEntry"  = PurchaseQuotationItem."BaseEntry"
		        AND PurchaseRequestOrderItem ."LineNum"  = PurchaseQuotationItem."BaseLine" 
		
		        INNER JOIN ${this.databaseName}.OPRQ PurchaseRequestOrder
		        ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"
		
		      WHERE 
		          PurchaseInvoiceItem."U_ALFA_Integrated" = 'N'
		      AND PurchaseInvoiceItem."U_ALFA_Retry" < 3 ---
		      AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL
		
		      UNION 
		
		      SELECT 
		        PurchaseRequestOrder."DocNum"               AS "SolReqNum"
		      FROM 
		        ${this.databaseName}.ORPC InvoiceDevolution
		        
		        INNER JOIN ${this.databaseName}.RPC1 InvoiceDevolutionItem
		        ON InvoiceDevolutionItem."DocEntry"  = InvoiceDevolution."DocEntry"
		        
		        INNER JOIN ${this.databaseName}.PCH1 PurchaseInvoiceItem
		        ON PurchaseInvoiceItem."DocEntry"  = InvoiceDevolutionItem."BaseEntry"
		        AND PurchaseInvoiceItem ."LineNum"  = InvoiceDevolutionItem."BaseLine" 
		
		        INNER JOIN ${this.databaseName}.POR1 PurchaseOrderItem
		        ON PurchaseOrderItem."DocEntry"  = PurchaseInvoiceItem."BaseEntry"
		        AND PurchaseOrderItem ."LineNum"  = PurchaseInvoiceItem."BaseLine" 
		        
		        INNER JOIN ${this.databaseName}.PQT1 PurchaseQuotationItem
		        ON PurchaseQuotationItem."DocEntry"  = PurchaseOrderItem."BaseEntry"
		        AND PurchaseQuotationItem ."LineNum"  = PurchaseOrderItem."BaseLine" 
		
		        INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
		        ON PurchaseRequestOrderItem."DocEntry"  = PurchaseQuotationItem."BaseEntry"
		        AND PurchaseRequestOrderItem ."LineNum"  = PurchaseQuotationItem."BaseLine" 
		
		        INNER JOIN ${this.databaseName}.OPRQ PurchaseRequestOrder
		        ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"
		
		      WHERE 
		          InvoiceDevolutionItem."U_ALFA_Integrated" = 'N'
		      AND InvoiceDevolutionItem."U_ALFA_Retry" < 3 ---
		      AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL
		) AS T1
    `);
    return await this.execute(query);
  }


  async getNotIntegrated(): Promise<any[]> {
    const query = (`   
    SELECT    
    Draft."DocEntry" 							          AS "SolReqNum"
  ,	ReserveTransferItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							        AS "HisDate" 
  ,	'Reservado' 								            AS "Status"
  ,	'WTR1' 										              AS "table"
  , ReserveTransferItem."DocEntry"          AS "DocEntry"	
  FROM 
  ${this.databaseName}.OWTR ReserveTransfer
  
  INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
  ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
    
  INNER JOIN ${this.databaseName}.ODRF Draft 
  ON Draft."ObjType" = 67
  AND ReserveTransfer."draftKey" = Draft."DocEntry"   
    
  WHERE 
      ReserveTransferItem."U_ALFA_Integrated" = 'N'
  AND ReserveTransferItem."U_ALFA_Retry" < 3 ---
  AND Draft."U_ALFA_RequestNumber" IS NOT NULL
  
  UNION 

  SELECT    
    Draft."DocEntry" 							          AS "SolReqNum"
  ,	ReserveTransferItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							        AS "HisDate" 
  ,	'Reserva cancelada'					            AS "Status"
  ,	'WTR1' 										              AS "table"
  , ReserveTransferItem."DocEntry"          AS "DocEntry"	
  FROM 
  ${this.databaseName}.OWTR ReserveTransfer
  
  INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
  ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
    
  INNER JOIN ${this.databaseName}.ODRF Draft 
  ON Draft."ObjType" = 67
  AND ReserveTransfer."draftKey" = Draft."DocEntry"   
    
  WHERE
      ReserveTransferItem."U_ALFA_Integrated" = 'Y'
  AND ReserveTransferItem."U_ALFA_IntegratedCancel" = 'N'
  AND ReserveTransferItem."U_ALFA_Retry" < 3 ---
  AND Draft."U_ALFA_RequestNumber" IS NOT NULL
  AND ReserveTransfer."CANCELED" = 'Y'
  
  UNION 

  SELECT    
    ReserverTransferRequest."DocEntry"      AS "SolReqNum"
  ,	ReserveTransferItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							        AS "HisDate" 
  ,	'Reservado' 								            AS "Status"
  ,	'WTR1' 										              AS "table"
  , ReserveTransferItem."DocEntry"          AS "DocEntry"	
  FROM 
  ${this.databaseName}.OWTR ReserveTransfer
  
  INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
  ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
    
  INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
  ON  ReserveTransferItem."BaseEntry" = ReserverTransferRequestItem."DocEntry" 
  AND ReserveTransferItem."BaseLine" = ReserverTransferRequestItem."LineNum" 
  AND ReserveTransferItem."BaseType" = 1250000001

  INNER JOIN ${this.databaseName}.OWTQ ReserverTransferRequest
  ON ReserverTransferRequestItem."DocEntry" = ReserverTransferRequest."DocEntry"
    
  WHERE 
      ReserveTransferItem."U_ALFA_Integrated" = 'N'
  AND ReserveTransferItem."U_ALFA_Retry" < 3 ---
  AND ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL
  
  UNION 

  SELECT    
    ReserverTransferRequest."DocEntry"      AS "SolReqNum"
  ,	ReserveTransferItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							        AS "HisDate" 
  ,	'Reserva cancelada' 				            AS "Status"
  ,	'WTR1' 										              AS "table"
  , ReserveTransferItem."DocEntry"          AS "DocEntry"	
  FROM 
    ${this.databaseName}.OWTR ReserveTransfer
  
  INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
  ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
    
  INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
  ON  ReserveTransferItem."BaseEntry" = ReserverTransferRequestItem."DocEntry" 
  AND ReserveTransferItem."BaseLine" = ReserverTransferRequestItem."LineNum" 
  AND ReserveTransferItem."BaseType" = 1250000001
  
  INNER JOIN ${this.databaseName}.OWTQ ReserverTransferRequest
  ON ReserverTransferRequestItem."DocEntry" = ReserverTransferRequest."DocEntry"
    
  WHERE 
      ReserveTransferItem."U_ALFA_Integrated" = 'Y'
  AND ReserveTransferItem."U_ALFA_IntegratedCancel" = 'N'
  AND ReserveTransferItem."U_ALFA_Retry" < 3 ---
  AND ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL
  AND ReserveTransfer."CANCELED" = 'Y'
  
  UNION 

  SELECT    
    ReserverTransferRequest."DocEntry"      		    AS "SolReqNum"
  ,	ReserverTransferRequestItem."U_ALFA_GATECId"	  AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							                AS "HisDate" 
  ,	'Reserva cancelada' 				                    AS "Status"
  ,	'WTQ1' 										                      AS "table"
  , ReserverTransferRequestItem."DocEntry"          AS "DocEntry"	
  FROM   
    ${this.databaseName}.OWTQ ReserverTransferRequest
        
    INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
    ON ReserverTransferRequest."DocEntry" = ReserverTransferRequestItem."DocEntry"   
  
    LEFT JOIN ${this.databaseName}.WTR1 ReserveTransferItem
    ON ReserveTransferItem."BaseEntry" = ReserverTransferRequestItem."DocEntry" 
    AND ReserveTransferItem."BaseLine" = ReserverTransferRequestItem."LineNum" 
    AND ReserveTransferItem."BaseType" = 1250000001
    
  WHERE       
        ReserverTransferRequestItem."U_ALFA_IntegratedCancel" = 'N'
  AND	ReserverTransferRequestItem."U_ALFA_Retry" < 3 ---
  AND 	ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL
  AND 	ReserverTransferRequestItem."LineStatus" = 'C'
  AND 	ReserveTransferItem."DocEntry" IS NULL

  UNION
  
  SELECT    
    Draft."DocEntry" 							            AS "SolReqNum"
  ,	ReserveTransferItem."U_ALFA_GATECId"		  AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							          AS "HisDate" 
  ,	'Enviado' 									              AS "Status"
  ,	'IGE1' 										                AS "table"
  , ReserveOutItem."DocEntry"                 AS "DocEntry"	
  FROM 
    ${this.databaseName}.OIGE ReserveOut
  
  INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
  ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
        
  
  INNER JOIN ${this.databaseName}.OWTR ReserveTransfer
  ON ReserveTransfer."U_ALFA_RequestNumber" = ReserveOut."U_ALFA_RequestNumber"   
        
  INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
  ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
  AND ReserveTransferItem."ItemCode" = ReserveOutItem."ItemCode"
        
  INNER JOIN ${this.databaseName}.ODRF Draft 
  ON Draft."ObjType" = 67
  AND ReserveTransfer."draftKey" = Draft."DocEntry"  
    
  WHERE 
      ReserveOutItem."U_ALFA_Integrated" = 'N'
  AND ReserveOutItem."U_ALFA_Retry" < 3 ---
  AND Draft."U_ALFA_RequestNumber" IS NOT NULL

  UNION 
  
  SELECT    
    ReserverTransferRequest."DocEntry"        AS "SolReqNum"
  ,	ReserveTransferItem."U_ALFA_GATECId"		  AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							          AS "HisDate" 
  ,	'Enviado' 									              AS "Status"
  ,	'IGE1' 										                AS "table"
  , ReserveOutItem."DocEntry"                 AS "DocEntry"	
  FROM 
    ${this.databaseName}.OIGE ReserveOut
  
  INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
  ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
        
  INNER JOIN ${this.databaseName}.OWTR ReserveTransfer
  ON ReserveTransfer."U_ALFA_RequestNumber" = ReserveOut."U_ALFA_RequestNumber"   
        
  INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
  ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
  AND ReserveTransferItem."ItemCode" = ReserveOutItem."ItemCode"
  
  INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
  ON ReserverTransferRequestItem."TargetType" = 67
  AND ReserveTransfer."DocEntry" = ReserverTransferRequestItem."TrgetEntry"   
  
  INNER JOIN ${this.databaseName}.OWTQ ReserverTransferRequest
  ON ReserverTransferRequestItem."DocEntry" = ReserverTransferRequest."DocEntry"
    
  WHERE 
      ReserveOutItem."U_ALFA_Integrated" = 'N'
  AND ReserveOutItem."U_ALFA_Retry" < 3 ---
  AND ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL

  UNION

  SELECT    
    Draft."DocEntry" 							          AS "SolReqNum"
  ,	ReserveInItem."U_ALFA_GATECId"		      AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							        AS "HisDate" 
  ,	'Devolvido' 								            AS "Status"
  ,	'IGN1' 										              AS "table"
  , ReserveInItem."DocEntry"                AS "DocEntry"	
  FROM 
  ${this.databaseName}.OIGN ReserveIn
  
  INNER JOIN ${this.databaseName}.IGN1 ReserveInItem
  ON ReserveIn."DocEntry" = ReserveInItem."DocEntry"
    
  INNER JOIN ${this.databaseName}.ODRF Draft 
  ON Draft."ObjType" = 59
  AND ReserveIn."draftKey" = Draft."DocEntry"   
    
  WHERE 
      ReserveInItem."U_ALFA_Integrated" = 'N'
  AND ReserveInItem."U_ALFA_Retry" < 3 ---
  AND Draft."U_ALFA_RequestNumber" IS NOT NULL
        
  UNION

  SELECT 
    PurchaseRequestOrder."DocNum"               AS "SolReqNum"
  ,	PurchaseRequestOrderItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							            AS "HisDate" 
  ,	'Requisição de compra cancelada'            AS "Status"
  , 'PRQ1'                                      AS "table"	
  , PurchaseRequestOrderItem."DocEntry"            AS "DocEntry"	
  FROM 
    ${this.databaseName}.OPRQ PurchaseRequestOrder

    INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
    ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"

  WHERE 
      PurchaseRequestOrderItem."U_ALFA_Integrated" = 'N'
  AND PurchaseRequestOrderItem."U_ALFA_Retry" < 3 ---
  AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL
  AND PurchaseRequestOrder."CANCELED" = 'Y'

  UNION

  SELECT 
    PurchaseRequestOrder."DocNum"               AS "SolReqNum"
  ,	PurchaseRequestOrderItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							            AS "HisDate" 
  ,	'Solicitação em oferta'                     AS "Status"
  , 'PQT1'                                      AS "table"	
  , PurchaseQuotationItem."DocEntry"            AS "DocEntry"	
  FROM 
    ${this.databaseName}.OPQT PurchaseQuotation

    INNER JOIN ${this.databaseName}.PQT1 PurchaseQuotationItem
    ON PurchaseQuotationItem."DocEntry"  = PurchaseQuotation."DocEntry"

    INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
    ON PurchaseRequestOrderItem."DocEntry"  = PurchaseQuotationItem."BaseEntry"
    AND PurchaseRequestOrderItem ."LineNum"  = PurchaseQuotationItem."BaseLine" 

    INNER JOIN ${this.databaseName}.OPRQ PurchaseRequestOrder
    ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"

  WHERE 
      PurchaseQuotationItem."U_ALFA_Integrated" = 'N'
  AND PurchaseQuotationItem."U_ALFA_Retry" < 3 ---
  AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL

  UNION

  SELECT 
    PurchaseRequestOrder."DocNum"               AS "SolReqNum"
  ,	PurchaseRequestOrderItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							            AS "HisDate" 
  ,	'Pedido gerado'                             AS "Status"
  , 'POR1'                                      AS "table"	
  , PurchaseOrderItem."DocEntry"                AS "DocEntry"	
  FROM 
    ${this.databaseName}.OPOR PurchaseOrder

    INNER JOIN ${this.databaseName}.POR1 PurchaseOrderItem
    ON PurchaseOrderItem."DocEntry"  = PurchaseOrder."DocEntry"
    
    INNER JOIN ${this.databaseName}.PQT1 PurchaseQuotationItem
    ON PurchaseQuotationItem."DocEntry"  = PurchaseOrderItem."BaseEntry"
    AND PurchaseQuotationItem ."LineNum"  = PurchaseOrderItem."BaseLine" 

    INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
    ON PurchaseRequestOrderItem."DocEntry"  = PurchaseQuotationItem."BaseEntry"
    AND PurchaseRequestOrderItem ."LineNum"  = PurchaseQuotationItem."BaseLine" 

    INNER JOIN ${this.databaseName}.OPRQ PurchaseRequestOrder
    ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"

  WHERE 
      PurchaseOrderItem."U_ALFA_Integrated" = 'N'
  AND PurchaseOrderItem."U_ALFA_Retry" < 3 ---
  AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL

  UNION 

  SELECT 
    PurchaseRequestOrder."DocNum"               AS "SolReqNum"
  ,	PurchaseRequestOrderItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							            AS "HisDate" 
  ,	'Nota fiscal gerada'                        AS "Status"
  , 'PCH1'                                      AS "table"	
  , PurchaseInvoiceItem."DocEntry"              AS "DocEntry"	
  FROM 
    ${this.databaseName}.OPCH PurchaseInvoice

    INNER JOIN ${this.databaseName}.PCH1 PurchaseInvoiceItem
    ON PurchaseInvoiceItem."DocEntry"  = PurchaseInvoice."DocEntry"

    INNER JOIN ${this.databaseName}.POR1 PurchaseOrderItem
    ON PurchaseOrderItem."DocEntry"  = PurchaseInvoiceItem."BaseEntry"
    AND PurchaseOrderItem ."LineNum"  = PurchaseInvoiceItem."BaseLine" 
    
    INNER JOIN ${this.databaseName}.PQT1 PurchaseQuotationItem
    ON PurchaseQuotationItem."DocEntry"  = PurchaseOrderItem."BaseEntry"
    AND PurchaseQuotationItem ."LineNum"  = PurchaseOrderItem."BaseLine" 

    INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
    ON PurchaseRequestOrderItem."DocEntry"  = PurchaseQuotationItem."BaseEntry"
    AND PurchaseRequestOrderItem ."LineNum"  = PurchaseQuotationItem."BaseLine" 

    INNER JOIN ${this.databaseName}.OPRQ PurchaseRequestOrder
    ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"

  WHERE 
      PurchaseInvoiceItem."U_ALFA_Integrated" = 'N'
  AND PurchaseInvoiceItem."U_ALFA_Retry" < 3 ---
  AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL

  UNION 

  SELECT 
    PurchaseRequestOrder."DocNum"               AS "SolReqNum"
  ,	PurchaseRequestOrderItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							            AS "HisDate" 
  ,	'Nota fiscal devolvida'                     AS "Status"
  , 'RPC1'                                      AS "table"	
  , InvoiceDevolutionItem."DocEntry"            AS "DocEntry"	
  FROM 
    ${this.databaseName}.ORPC InvoiceDevolution
    
    INNER JOIN ${this.databaseName}.RPC1 InvoiceDevolutionItem
    ON InvoiceDevolutionItem."DocEntry"  = InvoiceDevolution."DocEntry"
    
    INNER JOIN ${this.databaseName}.PCH1 PurchaseInvoiceItem
    ON PurchaseInvoiceItem."DocEntry"  = InvoiceDevolutionItem."BaseEntry"
    AND PurchaseInvoiceItem ."LineNum"  = InvoiceDevolutionItem."BaseLine" 

    INNER JOIN ${this.databaseName}.POR1 PurchaseOrderItem
    ON PurchaseOrderItem."DocEntry"  = PurchaseInvoiceItem."BaseEntry"
    AND PurchaseOrderItem ."LineNum"  = PurchaseInvoiceItem."BaseLine" 
    
    INNER JOIN ${this.databaseName}.PQT1 PurchaseQuotationItem
    ON PurchaseQuotationItem."DocEntry"  = PurchaseOrderItem."BaseEntry"
    AND PurchaseQuotationItem ."LineNum"  = PurchaseOrderItem."BaseLine" 

    INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
    ON PurchaseRequestOrderItem."DocEntry"  = PurchaseQuotationItem."BaseEntry"
    AND PurchaseRequestOrderItem ."LineNum"  = PurchaseQuotationItem."BaseLine" 

    INNER JOIN ${this.databaseName}.OPRQ PurchaseRequestOrder
    ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"

  WHERE 
      InvoiceDevolutionItem."U_ALFA_Integrated" = 'N'
  AND InvoiceDevolutionItem."U_ALFA_Retry" < 3 ---
  AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL

    `);
    const queryTest = (`
    SELECT    
    Draft."DocEntry" 							          AS "SolReqNum"
  ,	ReserveTransferItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							        AS "HisDate" 
  ,	'Reservado' 								            AS "Status"
  ,	'WTR1' 										              AS "table"
  , ReserveTransferItem."DocEntry"          AS "DocEntry"	
  , null 										                  AS "CriticalLevel"
  FROM 
  ${this.databaseName}.OWTR ReserveTransfer
  
  INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
  ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
    
  INNER JOIN ${this.databaseName}.ODRF Draft 
  ON Draft."ObjType" = 67
  AND ReserveTransfer."draftKey" = Draft."DocEntry"   
    
  WHERE 
      ReserveTransferItem."U_ALFA_Integrated" = 'N'
  AND Draft."U_ALFA_RequestNumber" IS NOT NULL
  
  UNION 

  SELECT    
    Draft."DocEntry" 							          AS "SolReqNum"
  ,	ReserveTransferItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							        AS "HisDate" 
  ,	'Reserva cancelada'					            AS "Status"
  ,	'WTR1' 										              AS "table"
  , ReserveTransferItem."DocEntry"          AS "DocEntry"
  , null 										                  AS "CriticalLevel"	
  FROM 
  ${this.databaseName}.OWTR ReserveTransfer
  
  INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
  ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
    
  INNER JOIN ${this.databaseName}.ODRF Draft 
  ON Draft."ObjType" = 67
  AND ReserveTransfer."draftKey" = Draft."DocEntry"   
    
  WHERE
      ReserveTransferItem."U_ALFA_Integrated" = 'Y'
  AND ReserveTransferItem."U_ALFA_IntegratedCancel" = 'N'
  AND Draft."U_ALFA_RequestNumber" IS NOT NULL
  AND ReserveTransfer."CANCELED" = 'Y'
  
  UNION 

  SELECT    
    ReserverTransferRequest."DocEntry"      AS "SolReqNum"
  ,	ReserveTransferItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							        AS "HisDate" 
  ,	'Reservado' 								            AS "Status"
  ,	'WTR1' 										              AS "table"
  , ReserveTransferItem."DocEntry"          AS "DocEntry"	
  , UserFields."Descr"								                  AS "CriticalLevel"
  FROM 
  ${this.databaseName}.OWTR ReserveTransfer
  
  INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
  ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
    
  INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
  ON  ReserveTransferItem."BaseEntry" = ReserverTransferRequestItem."DocEntry" 
  AND ReserveTransferItem."BaseLine" = ReserverTransferRequestItem."LineNum" 
  AND ReserveTransferItem."BaseType" = 1250000001

  INNER JOIN ${this.databaseName}.OWTQ ReserverTransferRequest
  ON ReserverTransferRequestItem."DocEntry" = ReserverTransferRequest."DocEntry"
  
  LEFT JOIN ${this.databaseName}.UFD1 UserFields 
  ON UserFields."FldValue" = ReserverTransferRequest."U_ALFA_NivelCriticidade"
    
  WHERE 
      ReserveTransferItem."U_ALFA_Integrated" = 'N'
  AND ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL
  
  UNION 

  SELECT    
    ReserverTransferRequest."DocEntry"      AS "SolReqNum"
  ,	ReserveTransferItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							        AS "HisDate" 
  ,	'Reserva cancelada' 				            AS "Status"
  ,	'WTR1' 										              AS "table"
  , ReserveTransferItem."DocEntry"          AS "DocEntry"
  , UserFields."Descr"							                  AS "CriticalLevel"	
  FROM 
    ${this.databaseName}.OWTR ReserveTransfer
  
  INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
  ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
    
  INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
  ON  ReserveTransferItem."BaseEntry" = ReserverTransferRequestItem."DocEntry" 
  AND ReserveTransferItem."BaseLine" = ReserverTransferRequestItem."LineNum" 
  AND ReserveTransferItem."BaseType" = 1250000001
  
  INNER JOIN ${this.databaseName}.OWTQ ReserverTransferRequest
  ON ReserverTransferRequestItem."DocEntry" = ReserverTransferRequest."DocEntry"
  
  LEFT JOIN ${this.databaseName}.UFD1 UserFields 
  ON UserFields."FldValue" = ReserverTransferRequest."U_ALFA_NivelCriticidade"
    
  WHERE 
      ReserveTransferItem."U_ALFA_Integrated" = 'Y'
  AND ReserveTransferItem."U_ALFA_IntegratedCancel" = 'N'
  AND ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL
  AND ReserveTransfer."CANCELED" = 'Y'
  
  UNION 

  SELECT    
    ReserverTransferRequest."DocEntry"      		    AS "SolReqNum"
  ,	ReserverTransferRequestItem."U_ALFA_GATECId"	  AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							                AS "HisDate" 
  ,	'Reserva cancelada' 				                    AS "Status"
  ,	'WTQ1' 										                      AS "table"
  , ReserverTransferRequestItem."DocEntry"          AS "DocEntry"
  , UserFields."Descr"		                          AS "CriticalLevel"	
  FROM   
    ${this.databaseName}.OWTQ ReserverTransferRequest
        
    INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
    ON ReserverTransferRequest."DocEntry" = ReserverTransferRequestItem."DocEntry"
    
    LEFT JOIN ${this.databaseName}.UFD1 UserFields 
    ON UserFields."FldValue" = ReserverTransferRequest."U_ALFA_NivelCriticidade"
  
    LEFT JOIN ${this.databaseName}.WTR1 ReserveTransferItem
    ON ReserveTransferItem."BaseEntry" = ReserverTransferRequestItem."DocEntry" 
    AND ReserveTransferItem."BaseLine" = ReserverTransferRequestItem."LineNum" 
    AND ReserveTransferItem."BaseType" = 1250000001
    
  WHERE       
        ReserverTransferRequestItem."U_ALFA_IntegratedCancel" = 'N'
  AND 	ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL
  AND 	ReserverTransferRequestItem."LineStatus" = 'C'
  AND 	ReserveTransferItem."DocEntry" IS NULL

  UNION
  
  SELECT    
    Draft."DocEntry" 							            AS "SolReqNum"
  ,	ReserveTransferItem."U_ALFA_GATECId"		  AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							          AS "HisDate" 
  ,	'Enviado' 									              AS "Status"
  ,	'IGE1' 										                AS "table"
  , ReserveOutItem."DocEntry"                 AS "DocEntry"
  , null 										                    AS "CriticalLevel"	
  FROM 
    ${this.databaseName}.OIGE ReserveOut
  
  INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
  ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
        
  
  INNER JOIN ${this.databaseName}.OWTR ReserveTransfer
  ON ReserveTransfer."U_ALFA_RequestNumber" = ReserveOut."U_ALFA_RequestNumber"   
        
  INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
  ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
  AND ReserveTransferItem."ItemCode" = ReserveOutItem."ItemCode"
        
  INNER JOIN ${this.databaseName}.ODRF Draft 
  ON Draft."ObjType" = 67
  AND ReserveTransfer."draftKey" = Draft."DocEntry"  
    
  WHERE 
      ReserveOutItem."U_ALFA_Integrated" = 'N'
  AND Draft."U_ALFA_RequestNumber" IS NOT NULL

  UNION 
  
  SELECT    
    ReserverTransferRequest."DocEntry"        AS "SolReqNum"
  ,	ReserveTransferItem."U_ALFA_GATECId"		  AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							          AS "HisDate" 
  ,	'Enviado' 									              AS "Status"
  ,	'IGE1' 										                AS "table"
  , ReserveOutItem."DocEntry"                 AS "DocEntry"
  , UserFields."Descr"								                    AS "CriticalLevel"	
  FROM 
    ${this.databaseName}.OIGE ReserveOut
  
  INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
  ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
        
  INNER JOIN ${this.databaseName}.OWTR ReserveTransfer
  ON ReserveTransfer."U_ALFA_RequestNumber" = ReserveOut."U_ALFA_RequestNumber"   
        
  INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
  ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
  AND ReserveTransferItem."ItemCode" = ReserveOutItem."ItemCode"
  
  INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
  ON ReserverTransferRequestItem."TargetType" = 67
  AND ReserveTransfer."DocEntry" = ReserverTransferRequestItem."TrgetEntry"   
  
  INNER JOIN ${this.databaseName}.OWTQ ReserverTransferRequest
  ON ReserverTransferRequestItem."DocEntry" = ReserverTransferRequest."DocEntry"
  
  LEFT JOIN ${this.databaseName}.UFD1 UserFields 
    ON UserFields."FldValue" = ReserverTransferRequest."U_ALFA_NivelCriticidade"
    
  WHERE 
      ReserveOutItem."U_ALFA_Integrated" = 'N'
  AND ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL

  UNION

  SELECT    
    Draft."DocEntry" 							          AS "SolReqNum"
  ,	ReserveInItem."U_ALFA_GATECId"		      AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							        AS "HisDate" 
  ,	'Devolvido' 								            AS "Status"
  ,	'IGN1' 										              AS "table"
  , ReserveInItem."DocEntry"                AS "DocEntry"
  , null 										                  AS "CriticalLevel"	
  FROM 
  ${this.databaseName}.OIGN ReserveIn
  
  INNER JOIN ${this.databaseName}.IGN1 ReserveInItem
  ON ReserveIn."DocEntry" = ReserveInItem."DocEntry"
    
  INNER JOIN ${this.databaseName}.ODRF Draft 
  ON Draft."ObjType" = 59
  AND ReserveIn."draftKey" = Draft."DocEntry"   
    
  WHERE 
      ReserveInItem."U_ALFA_Integrated" = 'N'
  AND Draft."U_ALFA_RequestNumber" IS NOT NULL
        
  UNION

  SELECT 
    PurchaseRequestOrder."DocNum"               AS "SolReqNum"
  ,	PurchaseRequestOrderItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							            AS "HisDate" 
  ,	'Requisição de compra cancelada'            AS "Status"
  , 'PRQ1'                                      AS "table"	
  , PurchaseRequestOrderItem."DocEntry"            AS "DocEntry"
  , null 										                  AS "CriticalLevel"	
  FROM 
    ${this.databaseName}.OPRQ PurchaseRequestOrder

    INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
    ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"

  WHERE 
      PurchaseRequestOrderItem."U_ALFA_Integrated" = 'N'
  AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL
  AND PurchaseRequestOrder."CANCELED" = 'Y'

  UNION

  SELECT 
    PurchaseRequestOrder."DocNum"               AS "SolReqNum"
  ,	PurchaseRequestOrderItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							            AS "HisDate" 
  ,	'Solicitação em oferta'                     AS "Status"
  , 'PQT1'                                      AS "table"	
  , PurchaseQuotationItem."DocEntry"            AS "DocEntry"
  , null 										                  AS "CriticalLevel"	
  FROM 
    ${this.databaseName}.OPQT PurchaseQuotation

    INNER JOIN ${this.databaseName}.PQT1 PurchaseQuotationItem
    ON PurchaseQuotationItem."DocEntry"  = PurchaseQuotation."DocEntry"

    INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
    ON PurchaseRequestOrderItem."DocEntry"  = PurchaseQuotationItem."BaseEntry"
    AND PurchaseRequestOrderItem ."LineNum"  = PurchaseQuotationItem."BaseLine" 

    INNER JOIN ${this.databaseName}.OPRQ PurchaseRequestOrder
    ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"

  WHERE 
      PurchaseQuotationItem."U_ALFA_Integrated" = 'N'
  AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL

  UNION

  SELECT 
    PurchaseRequestOrder."DocNum"               AS "SolReqNum"
  ,	PurchaseRequestOrderItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							            AS "HisDate" 
  ,	'Pedido gerado'                             AS "Status"
  , 'POR1'                                      AS "table"	
  , PurchaseOrderItem."DocEntry"                AS "DocEntry"
  , UserFields."Descr" 							AS "CriticalLevel"	
  FROM 
    ${this.databaseName}.OPOR PurchaseOrder

    INNER JOIN ${this.databaseName}.POR1 PurchaseOrderItem
    ON PurchaseOrderItem."DocEntry"  = PurchaseOrder."DocEntry"
    
    INNER JOIN ${this.databaseName}.PQT1 PurchaseQuotationItem
    ON PurchaseQuotationItem."DocEntry"  = PurchaseOrderItem."BaseEntry"
    AND PurchaseQuotationItem ."LineNum"  = PurchaseOrderItem."BaseLine" 

    INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
    ON PurchaseRequestOrderItem."DocEntry"  = PurchaseQuotationItem."BaseEntry"
    AND PurchaseRequestOrderItem ."LineNum"  = PurchaseQuotationItem."BaseLine" 

    INNER JOIN ${this.databaseName}.OPRQ PurchaseRequestOrder
    ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"
    
    LEFT JOIN ${this.databaseName}.UFD1 UserFields 
    ON UserFields."FldValue" = PurchaseOrder."U_ALFA_NivelCriticidade"

  WHERE 
      PurchaseOrderItem."U_ALFA_Integrated" = 'N'
  AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL
  
  UNION 

  SELECT 
    PurchaseRequestOrder."DocNum"               AS "SolReqNum"
  ,	PurchaseRequestOrderItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							            AS "HisDate" 
  ,	'Nota fiscal gerada'                        AS "Status"
  , 'PCH1'                                      AS "table"	
  , PurchaseInvoiceItem."DocEntry"              AS "DocEntry"
  , null 										                      AS "CriticalLevel"	
  FROM 
    ${this.databaseName}.OPCH PurchaseInvoice

    INNER JOIN ${this.databaseName}.PCH1 PurchaseInvoiceItem
    ON PurchaseInvoiceItem."DocEntry"  = PurchaseInvoice."DocEntry"

    INNER JOIN ${this.databaseName}.POR1 PurchaseOrderItem
    ON PurchaseOrderItem."DocEntry"  = PurchaseInvoiceItem."BaseEntry"
    AND PurchaseOrderItem ."LineNum"  = PurchaseInvoiceItem."BaseLine" 
    
    INNER JOIN ${this.databaseName}.PQT1 PurchaseQuotationItem
    ON PurchaseQuotationItem."DocEntry"  = PurchaseOrderItem."BaseEntry"
    AND PurchaseQuotationItem ."LineNum"  = PurchaseOrderItem."BaseLine" 

    INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
    ON PurchaseRequestOrderItem."DocEntry"  = PurchaseQuotationItem."BaseEntry"
    AND PurchaseRequestOrderItem ."LineNum"  = PurchaseQuotationItem."BaseLine" 

    INNER JOIN ${this.databaseName}.OPRQ PurchaseRequestOrder
    ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"

  WHERE 
      PurchaseInvoiceItem."U_ALFA_Integrated" = 'N'
  AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL

  UNION 

  SELECT 
    PurchaseRequestOrder."DocNum"               AS "SolReqNum"
  ,	PurchaseRequestOrderItem."U_ALFA_GATECId"		AS "IdKey" 
  ,	CURRENT_TIMESTAMP 							            AS "HisDate" 
  ,	'Nota fiscal devolvida'                     AS "Status"
  , 'RPC1'                                      AS "table"	
  , InvoiceDevolutionItem."DocEntry"            AS "DocEntry"
  , null 										                      AS "CriticalLevel"	
  FROM 
    ${this.databaseName}.ORPC InvoiceDevolution
    
    INNER JOIN ${this.databaseName}.RPC1 InvoiceDevolutionItem
    ON InvoiceDevolutionItem."DocEntry"  = InvoiceDevolution."DocEntry"
    
    INNER JOIN ${this.databaseName}.PCH1 PurchaseInvoiceItem
    ON PurchaseInvoiceItem."DocEntry"  = InvoiceDevolutionItem."BaseEntry"
    AND PurchaseInvoiceItem ."LineNum"  = InvoiceDevolutionItem."BaseLine" 

    INNER JOIN ${this.databaseName}.POR1 PurchaseOrderItem
    ON PurchaseOrderItem."DocEntry"  = PurchaseInvoiceItem."BaseEntry"
    AND PurchaseOrderItem ."LineNum"  = PurchaseInvoiceItem."BaseLine" 
    
    INNER JOIN ${this.databaseName}.PQT1 PurchaseQuotationItem
    ON PurchaseQuotationItem."DocEntry"  = PurchaseOrderItem."BaseEntry"
    AND PurchaseQuotationItem ."LineNum"  = PurchaseOrderItem."BaseLine" 

    INNER JOIN ${this.databaseName}.PRQ1 PurchaseRequestOrderItem
    ON PurchaseRequestOrderItem."DocEntry"  = PurchaseQuotationItem."BaseEntry"
    AND PurchaseRequestOrderItem ."LineNum"  = PurchaseQuotationItem."BaseLine" 

    INNER JOIN ${this.databaseName}.OPRQ PurchaseRequestOrder
    ON PurchaseRequestOrder."DocEntry"  = PurchaseRequestOrderItem."DocEntry"

  WHERE 
      InvoiceDevolutionItem."U_ALFA_Integrated" = 'N'
  AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL

    `);

    return await this.execute(query);
  }

  async setIntegrated(record: any): Promise<DatabaseResponse<any>> {

    const query = `
      UPDATE  
          ${this.databaseName}.${record.table} 
      SET 
        "${record.Status == 'Reserva cancelada' ? 'U_ALFA_IntegratedCancel' : 'U_ALFA_Integrated'}" = 'Y' 
      WHERE  "DocEntry" = ${record.DocEntry}
    `;
    return await this.exec(query);
  }
  async setError(record: any): Promise<DatabaseResponse<any>> {

    const query = `
      UPDATE  
          ${this.databaseName}.${record.table} 
      SET 
        "${record.Status == 'Reserva cancelada' ? 'U_ALFA_IntegratedCancel' : 'U_ALFA_Integrated'}" = 'E' 
      WHERE  "DocEntry" = ${record.DocEntry}
    `;
    return await this.exec(query);
  }

  async updateRetry(record: any): Promise<DatabaseResponse<any>> {
    const query = `UPDATE  ${this.databaseName}.${record.table} SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1 WHERE  "DocNum" = ${record.SolReqNum} AND "U_ALFA_RequestNumber" = ${record.IdKey}`;
    return await this.exec(query);
  }




}
