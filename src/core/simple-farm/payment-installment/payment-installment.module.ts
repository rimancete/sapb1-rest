import { Module } from '@nestjs/common';
import { SimpleFarmPaymentInstallmentService } from './payment-installment.service';
import { ConfigModule } from '../../config/config.module';
import { SimpleFarmHttpModule } from '../../../core/simple-farm/http/simple-farm-http.module';

@Module({
	imports: [ConfigModule, SimpleFarmHttpModule],
	providers: [SimpleFarmPaymentInstallmentService],
	exports: [SimpleFarmPaymentInstallmentService]
})

export class SimpleFarmPaymentInstallmentModule { }
