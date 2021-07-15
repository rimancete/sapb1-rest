import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmInventoryLocationService } from '../../core/simple-farm/inventory-location/inventory-location.service';
import { HanaInventoryLocationService } from '../../core/b1/hana/inventory-location/inventory-location.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import * as _ from 'lodash';
import { Exception } from '../../core/exception';

@Injectable()
export class InventoryLocationService extends Runner {

  private logger = new Logger(InventoryLocationService.name);

  constructor(
    private readonly hanaInventoryLocationService: HanaInventoryLocationService,
    private readonly simpleFarmInventoryLocationService: SimpleFarmInventoryLocationService,
    private readonly logsService: LogsService
  ) {
    super();
  }

  async proccess() {
    const records = await this.hanaInventoryLocationService.getNotIntegrated();

    if (records.length > 0) {
      this.logger.log(`Found ${records.length} records to integrate...`)
    }

    for (const record of records) {
      record["CompanySubsidiaries"] = JSON.parse(record["CompanySubsidiaries"]);
      record["ShortName"] = record["ShortName"] ? record["ShortName"].substring(0, 20) : '';
      record["Description"] = record["Description"] ? record["Description"].substring(0, 50) : '';
      try {
        const responseObject = await this.simpleFarmInventoryLocationService.upsert(record);
				// se NÂO tiver erro no response
				if (!responseObject.HasErrors){
          const responseInventoryLocationIntegrated = await this.hanaInventoryLocationService.setIntegrated(record);
          await this.logsService.logSuccess({
            key: record.Code, module: LogModule.INVENTORY_LOCATION, requestObject: record, responseObject
          });
        // se tiver erro no response, salva no log como erro
        }else{
          await this.hanaInventoryLocationService.updateRetry(record);
					// localiza valor em "ErrorMessages", "CriticalError" ou "Data"
					const errorMessages = responseObject.Result.Data.ErrorMessages;
					const criticalError = responseObject.Result.Data.CriticalError;
          const dataError = responseObject.Result.Data;
          await this.logsService.logError({ 
            key: record.Code, 
            module: LogModule.INVENTORY_LOCATION, 
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
        await this.hanaInventoryLocationService.updateRetry(record);
        await this.logsService.logError({ key: record.Code, module: LogModule.INVENTORY_LOCATION, exception });
      }
    }

    if (records.length > 0) {
      this.logger.log(`Finished integration...`)
    }

  }
}


