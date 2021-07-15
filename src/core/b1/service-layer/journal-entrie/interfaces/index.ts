import * as _ from 'lodash';

export interface Document {
  Number?: string,
  ProjectCode?: string,
  TaxDate?: string,
  DueDate?: Date,
  ReferenceDate?: string,
  Memo?: string,
  CostingCode?: string,
  BPLID?: string,
  JournalEntryLines?: DocumentLines[],
  EntryType?: string,
  Harvest?: number,
  Plantation?: number
}

export interface DocumentLines {
  BPLID?: string,
  AccountCode?: string,
  Debit?: number,
  Credit?: number,
  LineMemo?: string,
  CostingCode?: string,
  TaxDate?: string,
  DueDate?: Date,
  ReferenceDate1?: string,
  Percentage?: number,
  Type?: string
}
