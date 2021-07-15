import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmCompanyService } from '../../core/simple-farm/company/company.service';
import { HanaCompanyService } from '../../core/b1/hana/company/company.service'
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import { Exception } from '../../core/exception';

@Injectable()
export class CompanyService extends Runner {
	constructor(
		private readonly simpleFarmCompanyService: SimpleFarmCompanyService,
		private readonly hanaCompanyService: HanaCompanyService,
		private readonly logsService: LogsService
	) {
		super();
		this.maxRunners = 1;
	}

	private logger = new Logger(CompanyService.name);

	async proccess() {

		const records = await this.hanaCompanyService.getNotIntegrated();

		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {

			try {

				const responseObject = await this.simpleFarmCompanyService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					const responseCompanyInventory = await this.hanaCompanyService.setIntegrated(record);
					await this.logsService.logSuccess({
						key: record.Code, module: LogModule.COMPANY, requestObject: record, responseObject
					});
        		// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaCompanyService.updateRetry(record);
					// localiza valor em "ErrorMessages", "CriticalError" e "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					await this.logsService.logError({ 
						key: record.Code, 
						module: LogModule.COMPANY, 
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
				await this.hanaCompanyService.updateRetry(record);
				await this.logsService.logError({ key: record.Code, module: LogModule.COMPANY, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}
}