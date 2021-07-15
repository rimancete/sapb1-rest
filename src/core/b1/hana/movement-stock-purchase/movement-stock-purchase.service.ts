import { Injectable } from '@nestjs/common';
import { DatabaseResponse } from '../database/interfaces';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class HanaMovementStockPurchaseService extends DatabaseService<any> {

  countNotIntegrated(): Promise<any[]> {
    const query = (`  
    SELECT COUNT("Id") AS "QTDE"
    FROM
    (
      SELECT    
      Draft."DocEntry"                          AS "Id" 
      FROM 
      ${this.databaseName}.OIGE ReserveOut
      
      INNER JOIN ${this.databaseName}.OBPL Company
      ON Company."MainBPL" = 'Y'
      
      INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
      ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
          
      INNER JOIN ${this.databaseName}.OWTR ReserveTransfer
      ON ReserveTransfer."U_ALFA_RequestNumber" = ReserveOut."U_ALFA_RequestNumber"   
          
      INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
      ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
      AND ReserveTransferItem."ItemCode" = ReserveOutItem."ItemCode"
      AND ReserveTransferItem."DocEntry" = ReserveOutItem."U_ALFA_BaseEntry"
      
      LEFT JOIN ${this.databaseName}.ODRF Draft 
      ON Draft."ObjType" = 67
      AND ReserveTransfer."draftKey" = Draft."DocEntry"  
      
      WHERE 
        ReserveTransferItem."U_ALFA_IntegratedMovement" = 'N'
      AND ReserveTransferItem."U_ALFA_GATECId" <> '0'
      AND ReserveTransferItem."U_ALFA_Retry" < 3
      AND Draft."U_ALFA_RequestNumber" IS NOT NULL
      
      UNION
      
      SELECT    
      ReserverTransferRequest."DocEntry"        AS "Id" 
      FROM 
      ${this.databaseName}.OIGE ReserveOut
      
      INNER JOIN ${this.databaseName}.OBPL Company
      ON Company."MainBPL" = 'Y'
      
      INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
      ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
            
      INNER JOIN ${this.databaseName}.OWTR ReserveTransfer
      ON ReserveTransfer."U_ALFA_RequestNumber" = ReserveOut."U_ALFA_RequestNumber"   
            
      INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
      ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
      AND ReserveTransferItem."ItemCode" = ReserveOutItem."ItemCode"
      AND ReserveTransferItem."DocEntry" = ReserveOutItem."U_ALFA_BaseEntry"
                
      INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
      ON ReserverTransferRequestItem."TargetType" = 67
      AND ReserveTransfer."DocEntry" = ReserverTransferRequestItem."TrgetEntry"   
      
      INNER JOIN ${this.databaseName}.OWTQ ReserverTransferRequest
      ON ReserverTransferRequestItem."DocEntry" = ReserverTransferRequest."DocEntry"
              
      WHERE 
        ReserveTransferItem."U_ALFA_IntegratedMovement" = 'N'
        AND ReserveTransferItem."U_ALFA_GATECId"  <> '0'
        AND ReserveTransferItem."U_ALFA_Retry" < 3
      AND ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL
  
      UNION
  
      SELECT    
      ReserveOut."DocEntry"        AS "Id" 
      FROM 
      ${this.databaseName}.OIGE ReserveOut
      
      INNER JOIN ${this.databaseName}.OBPL Company
      ON Company."MainBPL" = 'Y'
      
      INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
      ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
              
      WHERE 
      
        ReserveOut."U_ALFA_Integrated" = 'N'
        AND ReserveOut."U_ALFA_Retry" < 3
        AND LEFT(ReserveOut."CreateDate",10) >= '2021-07-09'
      
      UNION
      
      SELECT    
      Draft."DocEntry"                          AS "Id" 
      FROM 
      ${this.databaseName}.OIGN ReserveIn
                  
      INNER JOIN ${this.databaseName}.OBPL Company
      ON Company."MainBPL" = 'Y'
      
      INNER JOIN ${this.databaseName}.IGN1 ReserveInItem
      ON ReserveIn."DocEntry" = ReserveInItem."DocEntry"
      
      LEFT JOIN ${this.databaseName}.ODRF Draft 
      ON Draft."ObjType" = 59
      AND ReserveIn."draftKey" = Draft."DocEntry"   
      
      WHERE 
        ReserveInItem."U_ALFA_IntegratedMovement" = 'N'
        AND ReserveInItem."U_ALFA_GATECId" <> '0'
        AND ReserveInItem."U_ALFA_Retry" < 3
      AND Draft."U_ALFA_RequestNumber" IS NOT NULL
      
      UNION
      
      SELECT    
      PurchaseInvoice."DocEntry"                AS "Id" 
      FROM 
      ${this.databaseName}.OPCH PurchaseInvoice
      
      INNER JOIN ${this.databaseName}.OBPL Company
      ON Company."MainBPL" = 'Y'
      
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
        PurchaseInvoiceItem."U_ALFA_IntegratedMovement" = 'N'
        AND PurchaseRequestOrderItem."U_ALFA_GATECId" <> '0'
        AND PurchaseInvoiceItem."U_ALFA_Retry" < 3
      AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL
      
      UNION
  
      SELECT    
      PurchaseInvoice."DocEntry"                AS "Id" 
      FROM 
      ${this.databaseName}.OPCH PurchaseInvoice
      
      INNER JOIN ${this.databaseName}.OBPL Company
      ON Company."MainBPL" = 'Y'
      
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
        PurchaseInvoiceItem."U_ALFA_IntegratedMovement" = 'N'
        AND PurchaseRequestOrderItem."U_ALFA_GATECId" = '0'
        AND PurchaseInvoiceItem."U_ALFA_Retry" < 3
        AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NULL
        AND (PurchaseInvoiceItem."AcctCode" LIKE '5%'
        OR  PurchaseInvoiceItem."AcctCode" LIKE '4%')
  
      UNION
      
      SELECT    
      InvoiceDevolution."DocEntry"                AS "Id" 
      FROM 
      ${this.databaseName}.ORPC InvoiceDevolution
              
      INNER JOIN ${this.databaseName}.OBPL Company
      ON Company."MainBPL" = 'Y'
      
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
        InvoiceDevolutionItem."U_ALFA_IntegratedMovement" = 'N'
        AND PurchaseRequestOrderItem."U_ALFA_GATECId" <> '0'
        AND InvoiceDevolutionItem."U_ALFA_Retry" < 3
      AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL
      ) AS T1
      `);
    return this.execute(query);
  }
  getNotIntegrated(): Promise<any[]> {
    const query = (`  
    SELECT    
    Draft."DocEntry"                          AS "Id" 
    , 1                                         AS "Type" /*REQUISIÇÃO*/
    , Company."BPLId"                           AS "CompanyCode"
    , ReserveOut."BPLId"                        AS "SubsidiaryCode" 
    , ReserveTransferItem."U_ALFA_GATECId"      AS "RequestId"
    , ReserveOut."DocDate"                      AS "AttendanceDate"
    , ReserveOutItem."OcrCode"                  AS "CostCenterCode"
    , ReserveOutItem."AcctCode"                 AS "AccountCode"
    , ReserveOutItem."ItemCode"                 AS "ItemCode"
    , ReserveOutItem."Quantity"                 AS "Quantity"
    , ReserveOutItem."Price"                    AS "UnitValues"
    , ReserveOutItem."LineTotal"                AS "TotalValues"
    , Draft."DocNum"                            AS "RequisitionNumber"
    , null                                      AS "Invoice"
    , null                                      AS "InvoiceSeries"
    , ReserveOut."Comments"
    ,	'WTR1' 										                AS "Table"
    , ReserveTransferItem."DocEntry"            AS "DocEntry"
    , ReserveOut."CardCode" 					          AS "SupplierCode"	
    FROM 
    ${this.databaseName}.OIGE ReserveOut
    
    INNER JOIN ${this.databaseName}.OBPL Company
    ON Company."MainBPL" = 'Y'
    
    INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
    ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
        
    INNER JOIN ${this.databaseName}.OWTR ReserveTransfer
    ON ReserveTransfer."U_ALFA_RequestNumber" = ReserveOut."U_ALFA_RequestNumber"   
        
    INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
    ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
    AND ReserveTransferItem."ItemCode" = ReserveOutItem."ItemCode"
    AND ReserveTransferItem."DocEntry" = ReserveOutItem."U_ALFA_BaseEntry"
    
    LEFT JOIN ${this.databaseName}.ODRF Draft 
    ON Draft."ObjType" = 67
    AND ReserveTransfer."draftKey" = Draft."DocEntry"  
    
    WHERE 
      ReserveTransferItem."U_ALFA_IntegratedMovement" = 'N'
    AND ReserveTransferItem."U_ALFA_GATECId" <> '0'
    AND ReserveTransferItem."U_ALFA_Retry" < 3
    AND Draft."U_ALFA_RequestNumber" IS NOT NULL
    
    UNION
    
    SELECT    
    ReserverTransferRequest."DocEntry"        AS "Id" 
    , 1                                         AS "Type" /*REQUISIÇÃO*/
    , Company."BPLId"                           AS "CompanyCode"
    , ReserveOut."BPLId"                        AS "SubsidiaryCode" 
    , ReserveTransferItem."U_ALFA_GATECId"      AS "RequestId"
    , ReserveOut."DocDate"                      AS "AttendanceDate"
    , ReserveOutItem."OcrCode"                  AS "CostCenterCode"
    , ReserveOutItem."AcctCode"                 AS "AccountCode"
    , ReserveOutItem."ItemCode"                 AS "ItemCode"
    , ReserveOutItem."Quantity"                 AS "Quantity"
    , ReserveOutItem."Price"                    AS "UnitValues"
    , ReserveOutItem."LineTotal"                AS "TotalValues"
    , ReserverTransferRequest."DocNum"          AS "RequisitionNumber"
    , null                                      AS "Invoice"
    , null                                      AS "InvoiceSeries"
    , ReserveOut."Comments"
    ,	'WTR1' 										                AS "Table"
    , ReserveTransferItem."DocEntry"            AS "DocEntry"
    , ReserveOut."CardCode" 					          AS "SupplierCode"	
    FROM 
    ${this.databaseName}.OIGE ReserveOut
    
    INNER JOIN ${this.databaseName}.OBPL Company
    ON Company."MainBPL" = 'Y'
    
    INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
    ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
          
    INNER JOIN ${this.databaseName}.OWTR ReserveTransfer
    ON ReserveTransfer."U_ALFA_RequestNumber" = ReserveOut."U_ALFA_RequestNumber"   
          
    INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
    ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
    AND ReserveTransferItem."ItemCode" = ReserveOutItem."ItemCode"
    AND ReserveTransferItem."DocEntry" = ReserveOutItem."U_ALFA_BaseEntry"
              
    INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
    ON ReserverTransferRequestItem."TargetType" = 67
    AND ReserveTransfer."DocEntry" = ReserverTransferRequestItem."TrgetEntry"   
    
    INNER JOIN ${this.databaseName}.OWTQ ReserverTransferRequest
    ON ReserverTransferRequestItem."DocEntry" = ReserverTransferRequest."DocEntry"
            
    WHERE 
      ReserveTransferItem."U_ALFA_IntegratedMovement" = 'N'
      AND ReserveTransferItem."U_ALFA_GATECId"  <> '0'
      AND ReserveTransferItem."U_ALFA_Retry" < 3
    AND ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL

    UNION

    SELECT    
    ReserveOut."DocEntry"        AS "Id" 
    , 1                                         AS "Type" /*REQUISIÇÃO*/
    , Company."BPLId"                           AS "CompanyCode"
    , ReserveOut."BPLId"                        AS "SubsidiaryCode" 
    , null      AS "RequestId"
    , ReserveOut."DocDate"                      AS "AttendanceDate"
    , ReserveOutItem."OcrCode"                  AS "CostCenterCode"
    , ReserveOutItem."AcctCode"                 AS "AccountCode"
    , ReserveOutItem."ItemCode"                 AS "ItemCode"
    , ReserveOutItem."Quantity"                 AS "Quantity"
    , ReserveOutItem."Price"                    AS "UnitValues"
    , ReserveOutItem."LineTotal"                AS "TotalValues"
    , ReserveOut."DocNum"           AS "RequisitionNumber"
    , null                                      AS "Invoice"
    , 'U_ALFA_Integrated'                                      AS "InvoiceSeries"
    , ReserveOut."Comments"
    ,	'OIGE' 										                AS "Table"
    , ReserveOut."DocEntry"            AS "DocEntry"
    , ReserveOut."CardCode" 					          AS "SupplierCode"	
    FROM 
    ${this.databaseName}.OIGE ReserveOut
    
    INNER JOIN ${this.databaseName}.OBPL Company
    ON Company."MainBPL" = 'Y'
    
    INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
    ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
            
    WHERE 
    
      ReserveOut."U_ALFA_Integrated" = 'N'
      AND ReserveOut."U_ALFA_Retry" < 3
    	AND LEFT(ReserveOut."CreateDate",10) >= '2021-07-09'
    
    UNION
    
    SELECT    
    Draft."DocEntry"                          AS "Id" 
    , 2                                         AS "Type"  /*DEVOLUÇÃO*/
    , Company."BPLId"                             AS "CompanyCode"
    , ReserveIn."BPLId"                         AS "SubsidiaryCode" 
    , ReserveInItem."U_ALFA_GATECId"            AS "RequestId"
    , ReserveIn."DocDate"                       AS "AttendanceDate"
    , ReserveInItem."OcrCode"                   AS "CostCenterCode"
    , ReserveInItem."AcctCode"                  AS "AccountCode"
    , ReserveInItem."ItemCode"                  AS "ItemCode"
    , ReserveInItem."Quantity"                  AS "Quantity"
    , ReserveInItem."Price"                     AS "UnitValues"
    , ReserveInItem."LineTotal"                 AS "TotalValues"
    , Draft."DocNum"                            AS "RequisitionNumber"
    , null                                      AS "Invoice"
    , null                                      AS "InvoiceSeries"
    , ReserveIn."Comments"
    ,	'IGN1' 										                AS "Table"
    , ReserveInItem."DocEntry"                  AS "DocEntry"
    , ReserveIn."CardCode" 						          AS "SupplierCode"	
    FROM 
    ${this.databaseName}.OIGN ReserveIn
                
    INNER JOIN ${this.databaseName}.OBPL Company
    ON Company."MainBPL" = 'Y'
    
    INNER JOIN ${this.databaseName}.IGN1 ReserveInItem
    ON ReserveIn."DocEntry" = ReserveInItem."DocEntry"
    
    LEFT JOIN ${this.databaseName}.ODRF Draft 
    ON Draft."ObjType" = 59
    AND ReserveIn."draftKey" = Draft."DocEntry"   
    
    WHERE 
      ReserveInItem."U_ALFA_IntegratedMovement" = 'N'
      AND ReserveInItem."U_ALFA_GATECId" <> '0'
      AND ReserveInItem."U_ALFA_Retry" < 3
    AND Draft."U_ALFA_RequestNumber" IS NOT NULL
    
    UNION
    
    SELECT    
    PurchaseInvoice."DocEntry"                AS "Id" 
    , 3                                         AS "Type"           /*Nota fiscal de compra*/
    , Company."BPLId"                           AS "CompanyCode"
    , PurchaseInvoice."BPLId"                   AS "SubsidiaryCode" 
    , PurchaseInvoiceItem."U_ALFA_GATECId" AS "RequestId"
    , PurchaseInvoice."DocDate"                 AS "AttendanceDate"
    , PurchaseInvoiceItem."OcrCode"             AS "CostCenterCode"
    , PurchaseInvoiceItem."AcctCode"            AS "AccountCode"
    , PurchaseInvoiceItem."ItemCode"            AS "ItemCode"
    , PurchaseInvoiceItem."Quantity"            AS "Quantity"
    , PurchaseInvoiceItem."Price"               AS "UnitValues"
    , PurchaseInvoiceItem."LineTotal"           AS "TotalValues"
    , PurchaseRequestOrder."DocNum"             AS "RequisitionNumber"
    , PurchaseInvoice."Serial"                  AS "Invoice"
    , PurchaseInvoice."SeriesStr"               AS "InvoiceSeries"
    , PurchaseInvoice."Comments"
    ,	'PCH1' 										                AS "Table"
    , PurchaseInvoiceItem."DocEntry"            AS "DocEntry"
    , PurchaseInvoice."CardCode" 				        AS "SupplierCode"	
    FROM 
    ${this.databaseName}.OPCH PurchaseInvoice
    
    INNER JOIN ${this.databaseName}.OBPL Company
    ON Company."MainBPL" = 'Y'
    
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
      PurchaseInvoiceItem."U_ALFA_IntegratedMovement" = 'N'
      AND PurchaseRequestOrderItem."U_ALFA_GATECId" <> '0'
      AND PurchaseInvoiceItem."U_ALFA_Retry" < 3
    AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL
    
    UNION

    SELECT    
    PurchaseInvoice."DocEntry"                AS "Id" 
    , 3                                         AS "Type"           /*Nota fiscal de compra fercus*/
    , Company."BPLId"                           AS "CompanyCode"
    , PurchaseInvoice."BPLId"                   AS "SubsidiaryCode" 
    , PurchaseInvoiceItem."U_ALFA_GATECId" AS "RequestId"
    , PurchaseInvoice."DocDate"                 AS "AttendanceDate"
    , PurchaseInvoiceItem."OcrCode"             AS "CostCenterCode"
    , PurchaseInvoiceItem."AcctCode"            AS "AccountCode"
    , PurchaseInvoiceItem."ItemCode"            AS "ItemCode"
    , PurchaseInvoiceItem."Quantity"            AS "Quantity"
    , PurchaseInvoiceItem."Price"               AS "UnitValues"
    , PurchaseInvoiceItem."LineTotal"           AS "TotalValues"
    , PurchaseRequestOrder."DocNum"             AS "RequisitionNumber"
    , PurchaseInvoice."Serial"                  AS "Invoice"
    , PurchaseInvoice."SeriesStr"               AS "InvoiceSeries"
    , PurchaseInvoice."Comments"
    ,	'PCH1' 										                AS "Table"
    , PurchaseInvoiceItem."DocEntry"            AS "DocEntry"
    , PurchaseInvoice."CardCode" 				        AS "SupplierCode"	
    FROM 
    ${this.databaseName}.OPCH PurchaseInvoice
    
    INNER JOIN ${this.databaseName}.OBPL Company
    ON Company."MainBPL" = 'Y'
    
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
      PurchaseInvoiceItem."U_ALFA_IntegratedMovement" = 'N'
      AND PurchaseRequestOrderItem."U_ALFA_GATECId" = '0'
      AND PurchaseInvoiceItem."U_ALFA_Retry" < 3
      AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NULL
      AND (PurchaseInvoiceItem."AcctCode" LIKE '5%'
      OR  PurchaseInvoiceItem."AcctCode" LIKE '4%')

    UNION
    
    SELECT    
    InvoiceDevolution."DocEntry"                AS "Id" 
    , 4                                           AS "Type"           /*Cancelamento Nota fiscal de compra*/
    , Company."BPLId"                             AS "CompanyCode"
    , InvoiceDevolution."BPLId"                   AS "SubsidiaryCode" 
    , PurchaseInvoiceItem."U_ALFA_GATECId"   AS "RequestId"
    , InvoiceDevolution."DocDate"                 AS "AttendanceDate"
    , InvoiceDevolutionItem."OcrCode"             AS "CostCenterCode"
    , InvoiceDevolutionItem."AcctCode"            AS "AccountCode"
    , InvoiceDevolutionItem."ItemCode"            AS "ItemCode"
    , InvoiceDevolutionItem."Quantity"            AS "Quantity"
    , InvoiceDevolutionItem."Price"               AS "UnitValues"
    , InvoiceDevolutionItem."LineTotal"           AS "TotalValues"
    , PurchaseRequestOrder."DocNum"               AS "RequisitionNumber"
    , InvoiceDevolution."Serial"                  AS "Invoice"
    , InvoiceDevolution."SeriesStr"               AS "InvoiceSeries"
    , InvoiceDevolution."Comments"
    ,	'RPC1' 										                  AS "Table"
    , InvoiceDevolutionItem."DocEntry"            AS "DocEntry"
    , InvoiceDevolution."CardCode" 				        AS "SupplierCode"	
    FROM 
    ${this.databaseName}.ORPC InvoiceDevolution
            
    INNER JOIN ${this.databaseName}.OBPL Company
    ON Company."MainBPL" = 'Y'
    
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
      InvoiceDevolutionItem."U_ALFA_IntegratedMovement" = 'N'
      AND PurchaseRequestOrderItem."U_ALFA_GATECId" <> '0'
      AND InvoiceDevolutionItem."U_ALFA_Retry" < 3
    AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL

    `);

    const queryCriticalLevel = (`
    SELECT    
    Draft."DocEntry"                          AS "Id" 
  , 1                                         AS "Type" -- REQUISIÇÃO
  , Company."BPLId"                           AS "CompanyCode"
  , ReserveOut."BPLId"                        AS "SubsidiaryCode" 
  , ReserveTransferItem."U_ALFA_GATECId"      AS "RequestId"
  , ReserveOut."DocDate"                      AS "AttendanceDate"
  , ReserveOutItem."OcrCode"                  AS "CostCenterCode"
  , ReserveOutItem."AcctCode"                 AS "AccountCode"
  , ReserveOutItem."ItemCode"                 AS "ItemCode"
  , ReserveOutItem."Quantity"                 AS "Quantity"
  , ReserveOutItem."Price"                    AS "UnitValues"
  , ReserveOutItem."LineTotal"                AS "TotalValues"
  , Draft."DocNum"                            AS "RequisitionNumber"
  , null                                      AS "Invoice"
  , null                                      AS "InvoiceSeries"
  , ReserveOut."Comments"
  ,	'WTR1' 										                AS "Table"
  , ReserveTransferItem."DocEntry"            AS "DocEntry"
  , null									                    AS "CriticalLevel"	
  FROM 
    ${this.databaseName}.OIGE ReserveOut
  
  INNER JOIN ${this.databaseName}.OBPL Company
  ON Company."MainBPL" = 'Y'
  
  INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
  ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
        
  INNER JOIN ${this.databaseName}.OWTR ReserveTransfer
  ON ReserveTransfer."U_ALFA_RequestNumber" = ReserveOut."U_ALFA_RequestNumber"   
        
  INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
  ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
  AND ReserveTransferItem."ItemCode" = ReserveOutItem."ItemCode"
  AND ReserveTransferItem."DocEntry" = ReserveOutItem."U_ALFA_BaseEntry"
  
  INNER JOIN ${this.databaseName}.ODRF Draft 
  ON Draft."ObjType" = 67
  AND ReserveTransfer."draftKey" = Draft."DocEntry"  
    
  WHERE 
      ReserveTransferItem."U_ALFA_IntegratedMovement" = 'N'
  AND Draft."U_ALFA_RequestNumber" IS NOT NULL
  
  UNION

  SELECT    
    ReserverTransferRequest."DocEntry"        AS "Id" 
  , 1                                         AS "Type" -- REQUISIÇÃO
  , Company."BPLId"                           AS "CompanyCode"
  , ReserveOut."BPLId"                        AS "SubsidiaryCode" 
  , ReserveTransferItem."U_ALFA_GATECId"      AS "RequestId"
  , ReserveOut."DocDate"                      AS "AttendanceDate"
  , ReserveOutItem."OcrCode"                  AS "CostCenterCode"
  , ReserveOutItem."AcctCode"                 AS "AccountCode"
  , ReserveOutItem."ItemCode"                 AS "ItemCode"
  , ReserveOutItem."Quantity"                 AS "Quantity"
  , ReserveOutItem."Price"                    AS "UnitValues"
  , ReserveOutItem."LineTotal"                AS "TotalValues"
  , ReserverTransferRequest."DocNum"          AS "RequisitionNumber"
  , null                                      AS "Invoice"
  , null                                      AS "InvoiceSeries"
  , ReserveOut."Comments"
  ,	'WTR1' 										                AS "Table"
  , ReserveTransferItem."DocEntry"            AS "DocEntry"
  , UserFields."Descr"		                    AS "CriticalLevel"	
  FROM 
    ${this.databaseName}.OIGE ReserveOut
  
    INNER JOIN ${this.databaseName}.OBPL Company
    ON Company."MainBPL" = 'Y'
    
    INNER JOIN ${this.databaseName}.IGE1 ReserveOutItem
    ON ReserveOutItem."DocEntry" = ReserveOut."DocEntry"
          
    INNER JOIN ${this.databaseName}.OWTR ReserveTransfer
    ON ReserveTransfer."U_ALFA_RequestNumber" = ReserveOut."U_ALFA_RequestNumber"   
          
    INNER JOIN ${this.databaseName}.WTR1 ReserveTransferItem
    ON ReserveTransferItem."DocEntry" = ReserveTransfer."DocEntry"
    AND ReserveTransferItem."ItemCode" = ReserveOutItem."ItemCode"
    AND ReserveTransferItem."DocEntry" = ReserveOutItem."U_ALFA_BaseEntry"
              
    INNER JOIN ${this.databaseName}.WTQ1 ReserverTransferRequestItem
    ON ReserverTransferRequestItem."TargetType" = 67
    AND ReserveTransfer."DocEntry" = ReserverTransferRequestItem."TrgetEntry"   
    
    INNER JOIN ${this.databaseName}.OWTQ ReserverTransferRequest
    ON ReserverTransferRequestItem."DocEntry" = ReserverTransferRequest."DocEntry"
    
    LEFT JOIN ${this.databaseName}.UFD1 UserFields 
    ON UserFields."FldValue" = ReserverTransferRequest."U_ALFA_NivelCriticidade"
            
  WHERE 
      ReserveTransferItem."U_ALFA_IntegratedMovement" = 'N'
  AND ReserverTransferRequest."U_ALFA_RequestNumber" IS NOT NULL

  UNION

  SELECT    
    Draft."DocEntry"                          AS "Id" 
  , 2                                         AS "Type" -- DEVOLUÇÃO
  , Company."BPLId"                             AS "CompanyCode"
  , ReserveIn."BPLId"                         AS "SubsidiaryCode" 
  , ReserveInItem."U_ALFA_GATECId"            AS "RequestId"
  , ReserveIn."DocDate"                       AS "AttendanceDate"
  , ReserveInItem."OcrCode"                   AS "CostCenterCode"
  , ReserveInItem."AcctCode"                  AS "AccountCode"
  , ReserveInItem."ItemCode"                  AS "ItemCode"
  , ReserveInItem."Quantity"                  AS "Quantity"
  , ReserveInItem."Price"                     AS "UnitValues"
  , ReserveInItem."LineTotal"                 AS "TotalValues"
  , Draft."DocNum"                            AS "RequisitionNumber"
  , null                                      AS "Invoice"
  , null                                      AS "InvoiceSeries"
  , ReserveIn."Comments"
  ,	'IGN1' 										                AS "Table"
  , ReserveInItem."DocEntry"                  AS "DocEntry"
  , null								                      AS "CriticalLevel"	
  FROM 
    ${this.databaseName}.OIGN ReserveIn
                
  INNER JOIN ${this.databaseName}.OBPL Company
  ON Company."MainBPL" = 'Y'

  INNER JOIN ${this.databaseName}.IGN1 ReserveInItem
  ON ReserveIn."DocEntry" = ReserveInItem."DocEntry"
    
  INNER JOIN ${this.databaseName}.ODRF Draft 
  ON Draft."ObjType" = 59
  AND ReserveIn."draftKey" = Draft."DocEntry"   
    
  WHERE 
      ReserveInItem."U_ALFA_IntegratedMovement" = 'N'
  AND Draft."U_ALFA_RequestNumber" IS NOT NULL

  UNION

  SELECT    
    PurchaseInvoice."DocEntry"                AS "Id" 
  , 3                                         AS "Type"           -- Nota fiscal de compra
  , Company."BPLId"                           AS "CompanyCode"
  , PurchaseInvoice."BPLId"                   AS "SubsidiaryCode" 
  , PurchaseRequestOrderItem."U_ALFA_GATECId" AS "RequestId"
  , PurchaseInvoice."DocDate"                 AS "AttendanceDate"
  , PurchaseInvoiceItem."OcrCode"             AS "CostCenterCode"
  , PurchaseInvoiceItem."AcctCode"            AS "AccountCode"
  , PurchaseInvoiceItem."ItemCode"            AS "ItemCode"
  , PurchaseInvoiceItem."Quantity"            AS "Quantity"
  , PurchaseInvoiceItem."Price"               AS "UnitValues"
  , PurchaseInvoiceItem."LineTotal"           AS "TotalValues"
  , PurchaseRequestOrder."DocNum"             AS "RequisitionNumber"
  , PurchaseInvoice."Serial"                  AS "Invoice"
  , PurchaseInvoice."SeriesStr"               AS "InvoiceSeries"
  , PurchaseInvoice."Comments"
  ,	'PCH1' 										                AS "Table"
  , PurchaseInvoiceItem."DocEntry"            AS "DocEntry"
  , null									                    AS "CriticalLevel"	
  FROM 
    ${this.databaseName}.OPCH PurchaseInvoice
    
    INNER JOIN ${this.databaseName}.OBPL Company
    ON Company."MainBPL" = 'Y'

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
      PurchaseInvoiceItem."U_ALFA_IntegratedMovement" = 'N'
  AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL

  UNION

  SELECT    
    InvoiceDevolution."DocEntry"                AS "Id" 
  , 4                                           AS "Type"           -- Cancelamento Nota fiscal de compra
  , Company."BPLId"                             AS "CompanyCode"
  , InvoiceDevolution."BPLId"                   AS "SubsidiaryCode" 
  , PurchaseRequestOrderItem."U_ALFA_GATECId"   AS "RequestId"
  , InvoiceDevolution."DocDate"                 AS "AttendanceDate"
  , InvoiceDevolutionItem."OcrCode"             AS "CostCenterCode"
  , InvoiceDevolutionItem."AcctCode"            AS "AccountCode"
  , InvoiceDevolutionItem."ItemCode"            AS "ItemCode"
  , InvoiceDevolutionItem."Quantity"            AS "Quantity"
  , InvoiceDevolutionItem."Price"               AS "UnitValues"
  , InvoiceDevolutionItem."LineTotal"           AS "TotalValues"
  , PurchaseRequestOrder."DocNum"               AS "RequisitionNumber"
  , InvoiceDevolution."Serial"                  AS "Invoice"
  , InvoiceDevolution."SeriesStr"               AS "InvoiceSeries"
  , InvoiceDevolution."Comments"
  ,	'RPC1' 										                  AS "Table"
  , InvoiceDevolutionItem."DocEntry"            AS "DocEntry"
  , null									                      AS "CriticalLevel"	
  FROM 
  ${this.databaseName}.ORPC InvoiceDevolution
            
    INNER JOIN ${this.databaseName}.OBPL Company
    ON Company."MainBPL" = 'Y'

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
      InvoiceDevolutionItem."U_ALFA_IntegratedMovement" = 'N'
  AND PurchaseRequestOrder."U_ALFA_RequestNumber" IS NOT NULL

    `);

    return this.execute(query);
  }

  setIntegrated(record: any): Promise<DatabaseResponse<any>> {
    let inquery = ''
    if (record.Table == 'OIGE' && record.InvoiceSeries == 'U_ALFA_Integrated'){
      inquery = `UPDATE ${this.databaseName}.${record.Table} SET "${record.InvoiceSeries}" = 'Y' WHERE "DocEntry" = ${record.DocEntry}`
    }else{
       inquery = `UPDATE ${this.databaseName}.${record.Table} SET "U_ALFA_IntegratedMovement" = 'Y' WHERE "DocEntry" = ${record.DocEntry}`
    }
    
    return this.exec(inquery);
  }

  setError(record: any): Promise<DatabaseResponse<any>> {
    const upquery = `UPDATE ${this.databaseName}.${record.Table} SET "U_ALFA_IntegratedMovement" = 'E'  WHERE "DocEntry" = ${record.DocEntry}`
    return this.exec(upquery);
  }

  updateRetry(record: any): Promise<DatabaseResponse<any>> {
    const upquery = `UPDATE ${this.databaseName}.${record.Table} SET "U_ALFA_Retry" = "U_ALFA_Retry" + 1  WHERE "DocEntry" = ${record.DocEntry}`
    return this.exec(upquery);
  }

  getIntegrationValues(): Promise<DatabaseResponse<any>> {

    return this.exec(`
	
		  `
    );
  }



}
