import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CompanyModule } from './service/company/company.module';
import { BranchModule } from './service/branch/branch.module';
import { CountryModule } from './service/country/country.module';
import { StateModule } from './service/state/state.module';
import { CityModule } from './service/city/city.module';
import { UnitMeasurementModule } from './service/unit-measurement/unit-measurement.module';
import { CurrencyModule } from './service/currency/currency.module';
import { CurrencyCategoryModule } from './service/currency-category/currency-category.module';
import { CurrencyQuoteModule } from './service/currency-quote/currency-quote.module';
import { CostCenterModule } from './service/cost-center/cost-center.module';
import { InvetoryLocationModule } from './service/inventory-location/inventory-location.module';
import { ItemGroupModule } from './service/item-group/item-group.module';
import { ItemFamilyModule } from './service/item-family/item-family.module';
import { ItemModule } from './service/item/item.module';
import { SupplierClientModule } from './service/supplier-client/supplier-client.module';
import { ItemPriceModule } from './service/item-price/item-price.module';
import { ItemInventoryModule } from './service/item-inventory/item-inventory.module';
import { ContractModule } from './service/contract/contract.module';
import { BatchModule } from './service/batch/batch.module';
import { TransactionModule } from './service/transaction/transaction.module'
import { PaymentConditionModule } from './service/payment-condition/payment-condition.module';
import { InvoiceCanceledModule } from './service/invoices-canceled/invoice-canceled.module';
import { InvoiceDownDeleteModule } from './service/invoices-down-delete/invoice-down-delete.module';
import { InvoiceDownModule } from './service/invoices-down/invoice-down.module';
import { InvoiceReturnModule } from './service/invoices-return/invoice-return.module';
import { InvoiceAntecipationModule } from './service/invoices-antecipation/invoice-antecipation.module';
import { RequestSituationHistoryModule } from './service/request-situation-history/request-situation-history.module';
import { MovementStockPurchaseModule } from './service/movement-stock-purchase/movement-stock-purchase.module';
import { InvoiceAntecipationDeleteModule } from './service/invoices-antecipation-delete/invoice-antecipation-delete.module';
import { AccountPaymentModule } from './service/account-payment/account-payment.module';
import { LedgerAccountModule } from './service/ledger-account/ledger-account.module';
import { PaymentInstallmentModule } from './service/payment-installment/payment-installment.module';
import { LedgerAccountValueModule } from './service/ledger-account-value/ledger-account-value.module';
import { AccountOriginModule } from './service/account-origin/account-origin.module';
import { config } from 'dotenv';

config();

@Module({
  imports: [
	  ScheduleModule.forRoot(),
	  BatchModule,
	  BranchModule,
	  CityModule,
	  CompanyModule,
	  ContractModule,
	   CostCenterModule,
	   CountryModule,
     CurrencyModule,
     CurrencyCategoryModule, 
     CurrencyQuoteModule, 
	   InvetoryLocationModule,
     InvoiceAntecipationModule,
     InvoiceAntecipationDeleteModule,
     InvoiceCanceledModule,
     InvoiceDownModule,
     InvoiceDownDeleteModule,
     InvoiceReturnModule,
	   ItemModule,
	   ItemFamilyModule,
	   ItemGroupModule,
	   ItemInventoryModule, 
	  ItemPriceModule,  
     MovementStockPurchaseModule,
	   PaymentConditionModule, 
	   RequestSituationHistoryModule,
	   StateModule,
	   SupplierClientModule,
       UnitMeasurementModule,	
	    // AccountOriginModule
		// LedgerAccountModule,
		// AccountPaymentModule
		// LedgerAccountValueModule,

		// TransactionModule,
		// PaymentInstallmentModule,
	],
	controllers: [],
	providers: [],
})
export class AppModule { }
