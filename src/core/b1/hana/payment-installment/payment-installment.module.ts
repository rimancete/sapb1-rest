import { Module } from '@nestjs/common';
import { HanaPaymentInstallmentService } from './payment-installment.service';
import { DatabaseModule } from '../database/database.module';

@Module({
	imports: [DatabaseModule],
	providers: [HanaPaymentInstallmentService],
	exports: [HanaPaymentInstallmentService]
})

export class HanaPaymentInstallmentModule { }
