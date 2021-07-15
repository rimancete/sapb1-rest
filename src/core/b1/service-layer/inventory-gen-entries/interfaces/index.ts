export interface InventoryGenEntry {
	DocNum?: string,
	DocDate?: string,
	DocDueDate?: string,
	DocTotal?: number,
  Reference2?: string,
  U_ALFA_RequestNumber: string,
	Comments?: string,
	BPL_IDAssignedToInvoice?: number,
	DocumentLines?: InventoryGenEntryLines[]
}

export interface InventoryGenEntryLines {
	ItemCode?: string,
	Quantity?: number,
	Price?: number,
	AccountCode?: string,
	LineTotal?: number,
	CostingCode?: string,
  WarehouseCode?: string,
	ProjectCode?: string,
	U_ALFA_TPCC?: string,
	BatchNumbers?: BatchNumber[]
}

export interface BatchNumber {
	BatchNumber?: string,
	AddmisionDate?: string,
	Quantity?: number
}