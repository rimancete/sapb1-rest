import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmCompanySubsidiaryService } from '../../core/simple-farm/company-subsidiary/company-subsidiary.service';
import { HanaBranchService } from '../../core/b1/hana/branch/branch.service'
import { LogsService } from '../../core/logs/logs.service'
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import { Runner } from '../../core/runner';
import { Exception } from '../../core/exception';

@Injectable()
export class BranchService extends Runner {

	private logger = new Logger(BranchService.name);

	constructor(
		private readonly simpleFarmCompanySubsidiaryService: SimpleFarmCompanySubsidiaryService,
		private readonly hanaBranchservice: HanaBranchService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {
		const records = await this.hanaBranchservice.getNotIntegrated();

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {
			try {
				const responseObject = await this.simpleFarmCompanySubsidiaryService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					const responseBranchIntegrated = await this.hanaBranchservice.setIntegrated(record);
					await this.logsService.logSuccess({
						key: record.Code, module: LogModule.BRANCH, requestObject: record, responseObject
					});

        		// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaBranchservice.updateRetry(record);
					// localiza valor em "ErrorMessages", "CriticalError" e "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					await this.logsService.logError({ 
						key: record.Code, 
						module: LogModule.BRANCH, 
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
				await this.hanaBranchservice.updateRetry(record);
				await this.logsService.logError({ key: record.Code, module: LogModule.BRANCH, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}

}