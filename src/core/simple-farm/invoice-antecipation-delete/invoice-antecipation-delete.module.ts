import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { SimpleFarmHttpModule } from '../../../core/simple-farm/http/simple-farm-http.module';
import { SimpleFarmInvoiceAntecipationDeleteService } from './invoice-antecipation-delete.service';

@Module({
	imports: [ConfigModule, SimpleFarmHttpModule],
	providers: [SimpleFarmInvoiceAntecipationDeleteService],
	exports: [SimpleFarmInvoiceAntecipationDeleteService]
})

export class SimpleFarmInvoiceAntecipationDeleteModule { }
