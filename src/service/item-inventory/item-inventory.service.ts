import { Injectable, Logger } from '@nestjs/common';
import * as _ from 'lodash';
import { HanaItemInventoryService } from '../../core/b1/hana/item-inventory/item-inventory.service';
import { SimpleFarmItemInventoryService } from '../..//core/simple-farm/item-inventory/item-inventory.service';
import { LogsService } from '../../core/logs/logs.service';
import { LogModule } from '../../core/logs/interface';
import { Runner } from '../../core/runner';
import { Exception } from '../../core/exception';
import * as Parallel from 'async-parallel';

@Injectable()
export class ItemInventoryService extends Runner {
  private logger = new Logger(ItemInventoryService.name);

  constructor(
    private readonly hanaItemInventoryService: HanaItemInventoryService,
    private readonly simpleFarmItemInventoryService: SimpleFarmItemInventoryService,
    private readonly logsService: LogsService,
  ) {
    super();
  }

  async proccess() {
    const countNotIntegrated = await this.hanaItemInventoryService.countNotIntegrated();
    const records = await this.hanaItemInventoryService.getNotIntegrated();
    if (records.length > 0) {
      this.logger.log(`Found ${records.length} records to integrate...`);
    }
      try {
        if (countNotIntegrated[0].QTDE === records.length){
          if (records.length > 0){
            const responseObject = await this.simpleFarmItemInventoryService.upsert(records);
            let counter = 0;
            for (const record of records){
              counter += 1;
              this.logger.log(`Processando ${counter}/${records.length}`);    
              if (!responseObject.HasErrors){
                  const key = `${record.ItemCode}|${record.InventoryLocationCode}`;
                  const responseItemInventory = await this.hanaItemInventoryService.setIntegrated(record);
                  console.log('item-inventory - item',record);
                  await this.logsService.logSuccess({ key, module: LogModule.ITEM_INVENTORY, requestObject: record, responseObject });
              } 
              else{
                  console.log('item-inventory - responseObject',responseObject);
                  const criticalError = responseObject.Result.Data.CriticalError;
                  if (!criticalError || criticalError === '') {
                    // GATEC como encontrar uma movimentação específica?
                    const errorMessages = _.find(_.get(responseObject, 'Result.Data.ErrorMessages', []), r => r['Item'] === record["RequestId"] );
                    if (!errorMessages){
                      console.log('item-inventory record errorMessages FALSE', record);
                      const key = `${record.ItemCode}|${record.InventoryLocationCode}`;
                      const responseItemInventory = await this.hanaItemInventoryService.setIntegrated(record);
                      await this.logsService.logSuccess({ key, module: LogModule.ITEM_INVENTORY, requestObject: record, responseObject });
                    } 
                    else {
                        console.log('invoice-down-delete record errorMessages TRUE', record);
                        const key = `${record.ItemCode}|${record.InventoryLocationCode}`;
                        await this.hanaItemInventoryService.updateRetry(record);
                        const responseSetError = await this.hanaItemInventoryService.setError(record);
                        await this.logsService.logError({ 
                          key, 
                          module: LogModule.ITEM_INVENTORY, 
                          exception: new Exception({
                            code: 'SF002',
                            message: 'Erro ao incluir/atualizar o registros no SimpleFarm.',
                            request: record,
                            response: errorMessages,
                          }) 
                        });
                      }
                  } 
                  else {
                      console.log('item-inventory - record - criticalError TRUE',record);
                      const key = `${record.ItemCode}|${record.InventoryLocationCode}`;
                      await this.hanaItemInventoryService.updateRetry(record);
                      const responseSetError = await this.hanaItemInventoryService.setError(record);
                      await this.logsService.logError({ 
                        key, 
                        module: LogModule.ITEM_INVENTORY, 
                        exception: new Exception({
                          code: 'SF002',
                          message: 'Erro ao incluir/atualizar o registros no SimpleFarm.',
                          request: record,
                          response: criticalError,
                        }) 
                      });
                  }
              }
            }
          }
        }
        else{
          console.log('item-inventory record count ERROR', countNotIntegrated[0].QTDE);
          console.log('item-inventory RECORDS count ERROR', records.length);
          for (const record of records){
            const key = `${record.ItemCode}|${record.InventoryLocationCode}`;
            await this.hanaItemInventoryService.updateRetry(record);
            const responseSetError = await this.hanaItemInventoryService.setError(record);
            await this.logsService.logError({ 
              key, 
              module: LogModule.ITEM_INVENTORY, 
              exception: new Exception({
                code: 'SF002',
                message: 'Erro ao incluir/atualizar o registros no SimpleFarm. Favor reprocessar a OS do ítem',
                request: record,
                response: 'Divergência na atualização de saldo. Favor reprocessar a atualização.',
              }) 
            });
          }
        }
      } 
      catch (exception) {
        console.log('item-inventory - exception',exception);
        console.log('item-inventory records exception', records);
        for (const record of records) {
          const responseSetError = await this.hanaItemInventoryService.setError(record);
          const key = `${record.ItemCode}|${record.InventoryLocationCode}`;
          await this.hanaItemInventoryService.updateRetry(record);
          await this.logsService.logError({ key, module: LogModule.ITEM_INVENTORY, exception });
        }
      }

    if (records.length > 0) {
      this.logger.log(`Finished integration...`);
    }
  }
}

// await Parallel.each(
//   records,
//   async record => {
//     const key = `${record.ItemCode}|${record.InventoryLocationCode}`;
//     counter++;
//     this.logger.log(`Processando ${counter}/${records.length}`);
//     try {
//       const upsertObject = { ...record };
//       delete upsertObject['ReserveWarehouse'];
//       const responseObject = await this.simpleFarmItemInventoryService.upsert(upsertObject);

//       await this.hanaItemInventoryService.setIntegrated(record);
//       this.logsService.logSuccess({
//         key,
//         module: LogModule.ITEM_INVENTORY,
//         requestObject: record,
//         responseObject,
//       });
//     } catch (exception) {
//       await this.hanaItemInventoryService.updateRetry(record);
//       this.logsService.logError({
//         key,
//         module: LogModule.ITEM_INVENTORY,
//         exception,
//       });
//     }
//   },
//   8,
// );
