import { Module } from '@nestjs/common';
import { HanaAccountPaymentService } from './account-payment.service';
import { DatabaseModule } from '../database/database.module';

@Module({
	imports: [DatabaseModule],
	providers: [HanaAccountPaymentService],
	exports: [HanaAccountPaymentService]
})

export class HanaAccountPaymentModule { }
