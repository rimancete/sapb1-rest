export interface InvoiceReturn {
	nFNumero: string,
	empresa: string,
	nfData: string,
	nfValor: number,
	idPedido: string,
	transacao: string,
	nfPeso: number,
	nfChave: string,
	nfTipo: string,
	especDocto: string,
	serie: string,
	emitente: string,
	vlImpostoPerc: number,
	vlImpostoPeso: number,
	dscImposto: number,
	nfPesoBruto: number,
	nfDataDigit: Date,
	Type: number,
	Code: number,
	CompanyCode: number,
	StartDate: Date,
	EndDate: Date,
	ProviderCode: string,
	Remark: string,
	nfParcelas: ParcelData
}

export interface ParcelData {
	empresa: string,
	nfNumero: string,
	nfChave: string,
	Parcela: string,
	vencimento: string,
	valor: string,
	numTitulo: string
}