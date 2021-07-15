import { Module } from '@nestjs/common';
import { MovementStockPurchaseService } from './movement-stock-purchase.service';
import { SimpleFarmItemPriceModule } from '../../core/simple-farm/item-price/item-price.module';
import { HanaMovementStockPurchaseModule } from '../../core/b1/hana/movement-stock-purchase/movement-stock-purchase.module';
import { LogsModule } from '../../core/logs/logs.module';
import { SimpleFarmMovementStockPurchaseModule } from '../../core/simple-farm/movement-stock-purchase/movement-stock-purchase.module';

@Module({
	imports: [HanaMovementStockPurchaseModule, SimpleFarmMovementStockPurchaseModule, SimpleFarmItemPriceModule, LogsModule],
	providers: [MovementStockPurchaseService],
	exports: [MovementStockPurchaseService]
})
export class MovementStockPurchaseModule { }
