export interface Invoice {
	empresa:    number,
	nfNumero:   number,
	nfChave:    string,
	parParcela: string, 
	seqPagamento: string,
	dataPagto:    string,
	valorPagto:   number,
	ptaxPagto:    number,
	seqFctoFinanErp: string
}