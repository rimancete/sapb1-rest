import { Injectable, Logger } from '@nestjs/common';
import { SimpleFarmMovementStockPurchaseService } from '../../core/simple-farm/movement-stock-purchase/movement-stock-purchase.service';
import { HanaMovementStockPurchaseService } from '../../core/b1/hana/movement-stock-purchase/movement-stock-purchase.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Runner } from '../../core/runner';
import { Exception } from 'src/core/exception';

@Injectable()
export class MovementStockPurchaseService extends Runner {

  private logger = new Logger(MovementStockPurchaseService.name);

  constructor(
    private readonly hanaMovementStockPurchaseService: HanaMovementStockPurchaseService,
    private readonly simpleFarmMovementStockPurchaseService: SimpleFarmMovementStockPurchaseService,
    private readonly logsService: LogsService
  ) {
    super();
  }

  async proccess() {
    const countNotIntegrated = await this.hanaMovementStockPurchaseService.countNotIntegrated();
    const records = await this.hanaMovementStockPurchaseService.getNotIntegrated();
    // const recordsFiltered = records.filter(r => r.RequestId !== '0' );

    if (records.length > 0) {
      this.logger.log(`Found ${records.length} records to integrate...`)
    }

      try{
        if (countNotIntegrated[0].QTDE === records.length){

            const data = records.map(record => {
              return {
                Id: record.Id,
                Type: record.Type,
                CompanyCode: record.CompanyCode,
                SubsidiaryCode: record.SubsidiaryCode,
                RequestId: record.RequestId,
                AttendanceDate: record.AttendanceDate,
                CostCenterCode: record.CostCenterCode,
                AccountCode: record.AccountCode,
                ItemCode: record.ItemCode,
                Quantity: record.Quantity,
                UnitValues: [{ "Value": record.UnitValues }],
                TotalValues: [{ "Value": record.TotalValues }],
                RequisitionNumber: record.RequisitionNumber,
                Invoice: record.Invoice,
                InvoiceSeries: record.InvoiceSeries,
                Comments: record.Comments,
                SupplierCode: record.SupplierCode
               
              };

            });
            if (data.length > 0){
              const responseObject = await this.simpleFarmMovementStockPurchaseService.upsert(data); 
            
              let counter = 0;
              for (const record of records) {
                counter += 1;
                this.logger.log(`Processando ${counter}/${records.length}`);    
                if (!responseObject.HasErrors) {
                  const responseMovementStockPurchase = await this.hanaMovementStockPurchaseService.setIntegrated(record);
                  await this.logsService.logSuccess({ key: record.DocEntry, module: LogModule.STOCK_MOVEMENT_REQUEST, requestObject: record, responseObject });
                } else {
                  const criticalError = responseObject.Result.Data.CriticalError;
                  if (!criticalError || criticalError === '') {
                    const errorMessages = _.find(_.get(responseObject, 'Result.Data.ErrorMessages', []), r => r['Item'] === record["RequestId"] );
                    if (!errorMessages) {
                      const responseMovementStockPurchase = await this.hanaMovementStockPurchaseService.setIntegrated(record);
                      await this.logsService.logSuccess({ key: record.DocEntry, module: LogModule.STOCK_MOVEMENT_REQUEST, requestObject: record, responseObject });
                    } else {
                      const responseSetError = await this.hanaMovementStockPurchaseService.setError(record);
                      await this.hanaMovementStockPurchaseService.updateRetry(record);
                      await this.logsService.logError({
                        key: record.DocEntry,
                        module: LogModule.STOCK_MOVEMENT_REQUEST,
                        exception: new Exception({
                          code: 'SF002',
                          message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
                          request: record,
                          response: errorMessages,
                        }),
                      });
                    }
                  }else{
                    const responseSetError = await this.hanaMovementStockPurchaseService.setError(record);
                    await this.hanaMovementStockPurchaseService.updateRetry(record);
                    await this.logsService.logError({
                      key: record.DocEntry,
                      module: LogModule.STOCK_MOVEMENT_REQUEST,
                      exception: new Exception({
                        code: 'SF002',
                        message: 'Erro ao incluir/atualizar o registros no SimpleFarm',
                        request: record,
                        response: criticalError,
                      }),
                    });
                  }
                }
              }
            }
        } 
        else {
          for (const record of records) {
            await this.hanaMovementStockPurchaseService.updateRetry(record);
            const responseSetError = await this.hanaMovementStockPurchaseService.setError(record);
            await this.logsService.logError({
              key: record.DocEntry,
              module: LogModule.STOCK_MOVEMENT_REQUEST,
              exception: new Exception({
                code: 'SF002',
                message: 'Erro ao incluir/atualizar o registros no SimpleFarm. Favor reprocessar a OS do ítem',
                request: record,
                response: 'Divergência nos ítens da OS. Favor reprocessar a OS.',
              }),
            });
          }
        }

      } 
      catch(exception){
        for (const record of records) {
          await this.hanaMovementStockPurchaseService.updateRetry(record);
          const responseSetError = await this.hanaMovementStockPurchaseService.setError(record);
          await this.logsService.logError({ key: record.DocEntry, module: LogModule.STOCK_MOVEMENT_REQUEST, exception });
        }
      }
      
      if (records.length > 0) {
        this.logger.log(`Finished integration...`)
      }

  }
}