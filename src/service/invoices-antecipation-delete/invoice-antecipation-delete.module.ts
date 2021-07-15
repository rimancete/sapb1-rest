import { Module } from '@nestjs/common';
import { LogsModule } from '../../core/logs/logs.module';
import { SimpleFarmInvoiceDownDeleteModule } from 'src/core/simple-farm/invoice-down-delete/invoice-down-delete.module';
import { HanaInvoiceDownDeleteModule } from 'src/core/b1/hana/invoice-down-delete/invoice-down-delete.module';
import { SimpleFarmInvoiceAntecipationDeleteModule } from 'src/core/simple-farm/invoice-antecipation-delete/invoice-antecipation-delete.module';
import { HanaInvoiceAntecipationDeleteModule } from 'src/core/b1/hana/invoice-antecipation-delete/invoice-antecipation-delete.module';
import { InvoiceAntecipationDeleteService } from './invoice-antecipation-delete.service';

@Module({
	imports: [HanaInvoiceAntecipationDeleteModule, SimpleFarmInvoiceAntecipationDeleteModule, LogsModule],
	providers: [InvoiceAntecipationDeleteService],
	exports: [InvoiceAntecipationDeleteService],
})
export class InvoiceAntecipationDeleteModule { }
