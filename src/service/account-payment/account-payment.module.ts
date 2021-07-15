import { Module } from '@nestjs/common';
import { AccountPaymentService } from './account-payment.service';
import { SimpleFarmAccountPaymentModule } from '../../core/simple-farm/account-payment/account-payment.module';
import { HanaAccountPaymentModule } from '../../core/b1/hana/account-payment/account-payment.module';
import { LogsModule } from '../../core/logs/logs.module';

@Module({
	imports: [HanaAccountPaymentModule, SimpleFarmAccountPaymentModule, LogsModule],
	providers: [AccountPaymentService],
	exports: [AccountPaymentService]
})
export class AccountPaymentModule { }
