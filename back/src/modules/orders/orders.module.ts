/**
 * OrdersModule - ماژول مدیریت سفارشات
 */
import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { AuthModule } from '../auth/auth.module.js';
import { SettlementQueueModule } from '../queues/settlement/settlement-queue.module.js';

@Module({
  imports: [AuthModule, SettlementQueueModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule { }
