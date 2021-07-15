import { Module } from '@nestjs/common';
import { LedgerAccountService } from './ledger-account.service';
import { SimpleFarmLedgerAccountModule } from '../../core/simple-farm/ledger-account/ledger-account.module';
import { HanaLedgerAccountModule } from '../../core/b1/hana/ledger-account/ledger-account.module';
import { LogsModule } from '../../core/logs/logs.module';

@Module({
	imports: [HanaLedgerAccountModule, SimpleFarmLedgerAccountModule, LogsModule],
	providers: [LedgerAccountService],
	exports: [LedgerAccountService]
})
export class LedgerAccountModule { }
