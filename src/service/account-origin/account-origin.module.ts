import { Module } from '@nestjs/common';
import { AccountOriginService } from './account-origin.service';
import { SimpleFarmAccountOriginModule } from '../../core/simple-farm/account-origin/account-origin.module';
import { HanaAccountOriginModule } from '../../core/b1/hana/account-origin/account-origin.module';
import { LogsModule } from '../../core/logs/logs.module';

@Module({
	imports: [HanaAccountOriginModule, SimpleFarmAccountOriginModule, LogsModule],
	providers: [AccountOriginService],
	exports: [AccountOriginService]
})
export class AccountOriginModule { }
