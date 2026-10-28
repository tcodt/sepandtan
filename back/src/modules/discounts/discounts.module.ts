/**
 * DiscountsModule - ماژول کدهای تخفیف
 */
import { Module } from '@nestjs/common';
import { DiscountsController } from './discounts.controller.js';
import { DiscountsService } from './discounts.service.js';
import { DiscountQueueModule } from '../queues/discount/discount-queue.module.js';
import { AuthModule } from '../auth/auth.module.js';


@Module({
    imports: [DiscountQueueModule, AuthModule],
    controllers: [DiscountsController],
    providers: [DiscountsService],
    exports: [DiscountsService]
})
export class DiscountsModule { }
