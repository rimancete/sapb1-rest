import { Module } from '@nestjs/common';
import { PaymentInstallmentService } from './payment-installment.service';
import { SimpleFarmPaymentInstallmentModule } from '../../core/simple-farm/payment-installment/payment-installment.module';
import { HanaPaymentInstallmentModule } from '../../core/b1/hana/payment-installment/payment-installment.module';
import { LogsModule } from '../../core/logs/logs.module';

@Module({
	imports: [HanaPaymentInstallmentModule, SimpleFarmPaymentInstallmentModule, LogsModule],
	providers: [PaymentInstallmentService],
	exports: [PaymentInstallmentService]
})
export class PaymentInstallmentModule { }
