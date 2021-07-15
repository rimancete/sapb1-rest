import { Module } from '@nestjs/common';
import { LogsModule } from '../../core/logs/logs.module';
import { HanaInvoiceReturnModule } from 'src/core/b1/hana/invoice-return/invoice-return.module';
import { SimpleFarmReturnInvoiceModule } from 'src/core/simple-farm/invoice-return/invoice-return.module';
import { InvoiceReturnService } from './invoice-return.service';

@Module({
	imports: [HanaInvoiceReturnModule, SimpleFarmReturnInvoiceModule, LogsModule],
	providers: [InvoiceReturnService],
	exports: [InvoiceReturnService],
})
export class InvoiceReturnModule { }
