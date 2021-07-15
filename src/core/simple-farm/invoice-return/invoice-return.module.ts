import { Module } from '@nestjs/common';
import { ConfigModule } from '../../config/config.module';
import { SimpleFarmHttpModule } from '../../../core/simple-farm/http/simple-farm-http.module';
import { SimpleFarmReturnInvoiceService } from './invoice-return.service';

@Module({
	imports: [ConfigModule, SimpleFarmHttpModule],
	providers: [SimpleFarmReturnInvoiceService],
	exports: [SimpleFarmReturnInvoiceService]
})

export class SimpleFarmReturnInvoiceModule { }
