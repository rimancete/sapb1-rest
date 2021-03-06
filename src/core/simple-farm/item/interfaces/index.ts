export interface Item {
	Code: string,
	CompanyCode?: string,
	Description: string,
	ShortDescription: string,
	TypeControl?: number,
	AvailableChemicalsApplication?: boolean,
	AvailableCommercialization?: boolean,
	AvailableWeighing?: boolean,
	AvailableBeneficiation?: boolean,
	AvailableIndustry?: boolean,
	AvailableAutomotive?: boolean,
	FamilyCode: string,
	GroupCode: string,
	Active: boolean,
	UnitCode: string,
	UnitApplicationCode: string,
	Type: number,
	ManufacturerCode?: string
}
