import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { SimpleFarmHttpModule } from '../../../core/simple-farm/http/simple-farm-http.module';
import { SimpleFarmInvoiceDownDeleteService } from './invoice-down-delete.service';

@Module({
	imports: [ConfigModule, SimpleFarmHttpModule],
	providers: [SimpleFarmInvoiceDownDeleteService],
	exports: [SimpleFarmInvoiceDownDeleteService]
})

export class SimpleFarmInvoiceDownDeleteModule { }
