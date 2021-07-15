import { Injectable, Logger } from '@nestjs/common';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { HanaContractService } from 'src/core/b1/hana/contract/contract.service';
import { SimpleFarmContractService } from 'src/core/simple-farm/contract/contract.service';
import { Exception } from '../../core/exception';

@Injectable()
export class ContractService extends Runner {

	private logger = new Logger(ContractService.name);

	constructor(
		private readonly hanaContractService: HanaContractService,
		private readonly simpleFarmContractService: SimpleFarmContractService,
		private readonly logsService: LogsService
	) {
		super();
	}

	async proccess() {

		const records = await this.hanaContractService.getNotIntegrated();
		
		if (records.length > 0) {
			this.logger.log(`Found ${records.length} records to integrate...`)
		}

		for (const record of records) {
			try {
        		const rawItens = await this.hanaContractService.getNotIntegratedItems(record.AbsID);
				const itens = rawItens.map(item => {
					return {
						AgricuturalOperation: (item.U_ALFA_Operation ? item.U_ALFA_Operation : 2),
						PointingUnit: (item.U_ALFA_FlowRate ? item.U_ALFA_FlowRate : 1),
						UnitaryValue: item.UnitPrice,
						DateContract: item.SignDate,
						EstimatedQtd: item.PlanQty
					}
				});
				const recordData = {
					Type: record.Type,
					Code: record.AbsID,
					CompanyCode: record.BPLId,
					StartDate: record.StartDate,
					EndDate: record.EndDate,
					Status: 1,
					ProviderCode: record.BpCode,
					Remark: record.Remarks,
					Items: itens
				}

				const responseObject = await this.simpleFarmContractService.upsert(recordData);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
					const responseContractIntegrated = await this.hanaContractService.setIntegrated(record);
					await this.logsService.logSuccess({
						key: record.AbsID, module: LogModule.CONTRACT, requestObject: recordData, responseObject
					});
				// se tiver erro no response, salva no log como erro
				}else{
					await this.hanaContractService.updateRetry(record);
					// localiza valor em "ErrorMessages", "CriticalError" e "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
					const dataError = responseObject.Result.Data;
					await this.logsService.logError({ 
						key: record.AbsID, 
						module: LogModule.CONTRACT, 
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
				await this.hanaContractService.updateRetry(record);
				await this.logsService.logError({ key: record.AbsID, module: LogModule.CONTRACT, exception });
			}
		}

		if (records.length > 0) {
			this.logger.log(`Finished integration...`)
		}

	}

}