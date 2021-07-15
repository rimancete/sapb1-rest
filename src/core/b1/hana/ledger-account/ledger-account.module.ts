import { Module } from '@nestjs/common';
import { HanaLedgerAccountService } from './ledger-account.service';
import { DatabaseModule } from '../database/database.module';

@Module({
	imports: [DatabaseModule],
	providers: [HanaLedgerAccountService],
	exports: [HanaLedgerAccountService]
})

export class HanaLedgerAccountModule { }
