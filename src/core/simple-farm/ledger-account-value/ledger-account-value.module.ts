import { Module } from '@nestjs/common';
import { SimpleFarmLedgerAccountValueService } from './ledger-account-value.service';
import { ConfigModule } from '../../config/config.module';
import { SimpleFarmHttpModule } from '../../../core/simple-farm/http/simple-farm-http.module';

@Module({
	imports: [ConfigModule, SimpleFarmHttpModule],
	providers: [SimpleFarmLedgerAccountValueService],
	exports: [SimpleFarmLedgerAccountValueService]
})

export class SimpleFarmLedgerAccountValueModule { }
