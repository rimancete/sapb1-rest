import { Module } from '@nestjs/common';
import { HanaLogModule } from '../b1/hana/log/log.module'
import { IntegrationService } from './integration.service';

@Module({
	imports: [HanaLogModule],
	providers: [IntegrationService],
	exports: [IntegrationService],
})
export class IntegrationModule { }

