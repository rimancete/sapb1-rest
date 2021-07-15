import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { SimpleFarmHttpModule } from '../../../core/simple-farm/http/simple-farm-http.module';
import { SimpleFarmInvoiceDownService } from './invoice-down.service';

@Module({
	imports: [ConfigModule, SimpleFarmHttpModule],
	providers: [SimpleFarmInvoiceDownService],
	exports: [SimpleFarmInvoiceDownService]
})

export class SimpleFarmInvoiceDownModule { }
