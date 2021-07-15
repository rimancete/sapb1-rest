import { Module } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { SimpleFarmTransactionModule } from '../../core/simple-farm/transaction/transaction.module';
import { HanaTransactionService } from 'src/core/b1/hana/transaction/transaction.service';
import { HanaTransactionModule } from 'src/core/b1/hana/transaction/transaction.module';
import { LogsModule } from 'src/core/logs/logs.module';
@Module({
	imports: [SimpleFarmTransactionModule, HanaTransactionModule,LogsModule],
	providers: [TransactionService],
	exports: [TransactionService],
})
export class TransactionModule { }

