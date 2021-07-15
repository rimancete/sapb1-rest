export interface PaymentInstallment {
	PaymentConditionCode: string,
	Sequence?: number,
	PercentValue: number,
	Amount?: number,
	Days?: number,
	DayOfMonth?: number
}
