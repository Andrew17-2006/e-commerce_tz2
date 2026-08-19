import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { InventoryService } from './inventory.service';
import { OrdersRepository } from './orders.repository';
import { OrdersProcessor } from './orders.processor';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [QueueModule],
  providers: [OrdersService, InventoryService, OrdersRepository, OrdersProcessor],
  controllers: [OrdersController],
  exports: [InventoryService],
})
export class OrdersModule {}
