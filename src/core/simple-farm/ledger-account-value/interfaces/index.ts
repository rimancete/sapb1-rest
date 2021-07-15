export interface LedgerAccountValue {
	CompanyCode: string,
	SubsidiaryCode: string,
	AccountCode: number,
	CostCenterCode?: string,
	Order?: string,
	Month: string,
	Values: Values[],
	OriginCode: string
}

export interface Values {
	CurrencyIso: number,
	Value: number
}
