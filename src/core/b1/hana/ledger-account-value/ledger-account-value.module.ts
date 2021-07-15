import { Module } from '@nestjs/common';
import { HanaLedgerAccountValueService } from './ledger-account-value.service';
import { DatabaseModule } from '../database/database.module';

@Module({
	imports: [DatabaseModule],
	providers: [HanaLedgerAccountValueService],
	exports: [HanaLedgerAccountValueService]
})

export class HanaLedgerAccountValueModule { }
