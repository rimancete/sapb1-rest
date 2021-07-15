import { Module } from '@nestjs/common';
import { HanaAccountOriginService } from './account-origin.service';
import { DatabaseModule } from '../database/database.module';

@Module({
	imports: [DatabaseModule],
	providers: [HanaAccountOriginService],
	exports: [HanaAccountOriginService]
})

export class HanaAccountOriginModule { }
