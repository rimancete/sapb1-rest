import { Module } from '@nestjs/common';
import { LogsModule } from '../../core/logs/logs.module';
import { SimpleFarmCanceledInvoiceModule } from 'src/core/simple-farm/invoice-canceled/invoice-canceled.module';
import { InvoiceCanceledService } from './invoice-canceled.service';
import { HanaInvoiceCanceledModule } from 'src/core/b1/hana/invoice-canceled/invoice-canceled.module';

@Module({
	imports: [HanaInvoiceCanceledModule, SimpleFarmCanceledInvoiceModule, LogsModule],
	providers: [InvoiceCanceledService],
	exports: [InvoiceCanceledService],
})
export class InvoiceCanceledModule { }
