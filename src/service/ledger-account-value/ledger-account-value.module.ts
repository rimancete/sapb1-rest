import { Module } from '@nestjs/common';
import { LedgerAccountValueService } from './ledger-account-value.service';
import { SimpleFarmLedgerAccountValueModule } from '../../core/simple-farm/ledger-account-value/ledger-account-value.module';
import { HanaLedgerAccountValueModule } from '../../core/b1/hana/ledger-account-value/ledger-account-value.module';
import { LogsModule } from '../../core/logs/logs.module';

@Module({
	imports: [HanaLedgerAccountValueModule, SimpleFarmLedgerAccountValueModule, LogsModule],
	providers: [LedgerAccountValueService],
	exports: [LedgerAccountValueService]
})
export class LedgerAccountValueModule { }
