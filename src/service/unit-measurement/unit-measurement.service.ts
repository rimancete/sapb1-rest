import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmUnitMeasurementService } from '../../core/simple-farm/unit-measurement/unit-measurement.service';
import { HanaUnitMeasurementService } from '../../core/b1/hana/unit-measurement/unit-measurement.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import { Runner } from '../../core/runner';
import { Exception } from 'src/core/exception';

@Injectable()
export class UnitMeasurementService extends Runner {

	private logger = new Logger(UnitMeasurementService.name);

	constructor(
		private readonly simpleFarmUnitMeasurementService: SimpleFarmUnitMeasurementService,
		private readonly hanaUnitMeasurementService: HanaUnitMeasurementService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {

		const records = await this.hanaUnitMeasurementService.getNotIntegrated();

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {
			try {
				const responseObject = await this.simpleFarmUnitMeasurementService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					const responseUnitMeasurementIntegrated = await this.hanaUnitMeasurementService.setIntegrated(record);
					await this.logsService.logSuccess({
						key: record.Code, module: LogModule.UNIT_MEASUREMENT, requestObject: record, responseObject
					});
				// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaUnitMeasurementService.updateRetry(record);
					// localiza valor em "ErrorMessages", "CriticalError" e "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					this.logsService.logError({ 
						key: record.Code, 
						module: LogModule.UNIT_MEASUREMENT, 
						exception: new Exception({
							code: 'SF002',
							message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
							request: record,
							// testa onde estão os erros e insere-o
							response: 
							typeof errorMessages !== 'undefined' || errorMessages !== [] ? errorMessages : 
							typeof criticalError !== 'undefined' || criticalError !== '' ? criticalError : 
							typeof dataError === 'string' ? dataError : 'Erro desconhecido',
						}), 
					});
				}
			}
			catch (exception) {
				await this.hanaUnitMeasurementService.updateRetry(record);
				this.logsService.logError({ key: record.Code, module: LogModule.UNIT_MEASUREMENT, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}
}