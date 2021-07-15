import * as _ from 'lodash';

export interface Invoice {
	DocEntry?: string,
	DocNum?: string,
	DocDate?: string,
	CardCode?: string,
	DocDueDate?: string,
	DocTotal?: number,
	RequriedDate?: string,
	Reference2?: string,
	Requester?: string,
	Reqtype?: string,
	Comments?: string,
	DocObjectCode?: string,
	RequesterEmail?: string,
	U_ALFA_RequestNumber?: string,
	BPL_IDAssignedToInvoice?: number,
  BaseEntry?: string,
  U_ChaveAcesso?: string,
	DocumentLines?: InvoiceLine[]
}

export interface InvoiceLine {
	ItemCode?: string,
	Quantity?: number,
	WarehouseCode?: string,
	CostingCode?: string,
	AccountCode?: string,
  TaxCode?: string,
  Usage?:string
}

export interface InvoiceSF {
  empresa: any,
  idPedido: any,
  parParcela: any,
  numTitulo: any,
  dataPagto: any,
  valorPagto: any,
  ptaxPagto: any,
  seqFctoFinanErp: any

}