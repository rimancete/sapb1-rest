import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmCostCenterService } from '../../core/simple-farm/cost-center/cost-center.service';
import { HanaCostCenterService } from '../../core/b1/hana/cost-center/cost-center.service'
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { Exception } from '../../core/exception';

@Injectable()
export class CostCenterService extends Runner {

	private logger = new Logger(CostCenterService.name);

	constructor(
		private readonly simpleFarmCostCenterService: SimpleFarmCostCenterService,
		private readonly hanaCostCenterService: HanaCostCenterService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {

		let records = await this.hanaCostCenterService.getNotIntegrated();
		records = records.filter(r => _.isInteger(_.parseInt(r.Code)));

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {
			try {
				const responseObject = await this.simpleFarmCostCenterService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					const responseCostCenterIntegrated = await this.hanaCostCenterService.setIntegrated(record);
					await this.logsService.logSuccess({
						key: record.Code, module: LogModule.COST_CENTER, requestObject: record, responseObject
					});
				// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaCostCenterService.updateRetry(record);
					// localiza valor em "ErrorMessages", "CriticalError" ou "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					await this.logsService.logError({ 
						key: record.Code, 
						module: LogModule.COST_CENTER, 
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
			} catch (exception) {
				await this.hanaCostCenterService.updateRetry(record);
				await this.logsService.logError({ key: record.Code, module: LogModule.COST_CENTER, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}
}