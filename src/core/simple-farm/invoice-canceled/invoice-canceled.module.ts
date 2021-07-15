import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { SimpleFarmHttpModule } from '../../../core/simple-farm/http/simple-farm-http.module';
import { SimpleFarmCanceledInvoiceService } from './invoice-canceled.service';

@Module({
	imports: [ConfigModule, SimpleFarmHttpModule],
	providers: [SimpleFarmCanceledInvoiceService],
	exports: [SimpleFarmCanceledInvoiceService]
})

export class SimpleFarmCanceledInvoiceModule { }
