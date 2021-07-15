import { Module } from '@nestjs/common';
import { LogsModule } from '../../core/logs/logs.module';
import { InvoiceDownService } from './invoice-down.service';
import { HanaInvoiceDownModule } from 'src/core/b1/hana/invoice-down/invoice-down.module';
import { SimpleFarmInvoiceDownModule } from 'src/core/simple-farm/invoice-down/invoice-down.module';

@Module({
	imports: [HanaInvoiceDownModule, SimpleFarmInvoiceDownModule, LogsModule],
	providers: [InvoiceDownService],
	exports: [InvoiceDownService],
})
export class InvoiceDownModule { }
