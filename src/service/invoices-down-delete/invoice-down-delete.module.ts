import { Module } from '@nestjs/common';
import { LogsModule } from '../../core/logs/logs.module';
import { SimpleFarmInvoiceDownDeleteModule } from 'src/core/simple-farm/invoice-down-delete/invoice-down-delete.module';
import { HanaInvoiceDownDeleteModule } from 'src/core/b1/hana/invoice-down-delete/invoice-down-delete.module';
import { InvoiceDownDeleteService } from './invoice-down-delete.service';

@Module({
	imports: [HanaInvoiceDownDeleteModule, SimpleFarmInvoiceDownDeleteModule, LogsModule],
	providers: [InvoiceDownDeleteService],
	exports: [InvoiceDownDeleteService],
})
export class InvoiceDownDeleteModule { }
