export interface LedgerAccount {
	Code: number,
	LevelCode?: number,
	ShortCode?: string,
	Description: string,
	ParentCode?: number,
	Level?: number,
	ChildrenCount?: number,
	CompanyCode: string,
	SubsidiaryCode: string,
	Active?: boolean,
	Type?: number
}
