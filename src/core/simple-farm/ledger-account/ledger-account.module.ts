import { Module } from '@nestjs/common';
import { SimpleFarmLedgerAccountService } from './ledger-account.service';
import { ConfigModule } from '../../config/config.module';
import { SimpleFarmHttpModule } from '../../../core/simple-farm/http/simple-farm-http.module';

@Module({
	imports: [ConfigModule, SimpleFarmHttpModule],
	providers: [SimpleFarmLedgerAccountService],
	exports: [SimpleFarmLedgerAccountService]
})

export class SimpleFarmLedgerAccountModule { }
