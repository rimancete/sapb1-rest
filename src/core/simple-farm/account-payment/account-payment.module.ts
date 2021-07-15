import { Module } from '@nestjs/common';
import { SimpleFarmAccountPaymentService } from './account-payment.service';
import { ConfigModule } from '../../config/config.module';
import { SimpleFarmHttpModule } from '../../../core/simple-farm/http/simple-farm-http.module';

@Module({
	imports: [ConfigModule, SimpleFarmHttpModule],
	providers: [SimpleFarmAccountPaymentService],
	exports: [SimpleFarmAccountPaymentService]
})

export class SimpleFarmAccountPaymentModule { }
