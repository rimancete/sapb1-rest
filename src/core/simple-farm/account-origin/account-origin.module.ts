import { Module } from '@nestjs/common';
import { SimpleFarmAccountOriginService } from './account-origin.service';
import { ConfigModule } from '../../config/config.module';
import { SimpleFarmHttpModule } from '../../../core/simple-farm/http/simple-farm-http.module';

@Module({
	imports: [ConfigModule, SimpleFarmHttpModule],
	providers: [SimpleFarmAccountOriginService],
	exports: [SimpleFarmAccountOriginService]
})

export class SimpleFarmAccountOriginModule { }
