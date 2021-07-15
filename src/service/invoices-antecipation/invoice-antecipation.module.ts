import { Module } from '@nestjs/common';
import { LogsModule } from '../../core/logs/logs.module';
import { SimpleFarmInvoiceAntecipationModule } from 'src/core/simple-farm/invoice-antecipation/invoice-antecipation.module';
import { HanaInvoiceAntecipationModule } from 'src/core/b1/hana/invoice-antecipation/invoice-antecipation.module';
import { InvoiceAntecipationService } from './invoice-antecipation.service';

@Module({
	imports: [HanaInvoiceAntecipationModule, SimpleFarmInvoiceAntecipationModule, LogsModule],
	providers: [InvoiceAntecipationService],
	exports: [InvoiceAntecipationService],
})
export class InvoiceAntecipationModule { }
