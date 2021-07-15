import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { SimpleFarmHttpModule } from '../../../core/simple-farm/http/simple-farm-http.module';
import { SimpleFarmInvoiceAntecipationService } from './invoice-antecipation.service';

@Module({
	imports: [ConfigModule, SimpleFarmHttpModule],
	providers: [SimpleFarmInvoiceAntecipationService],
	exports: [SimpleFarmInvoiceAntecipationService]
})

export class SimpleFarmInvoiceAntecipationModule { }
