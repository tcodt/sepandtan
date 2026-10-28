// discount-queue.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DiscountQueueService } from './discount-queue.service.js';
import { VariantsModule } from '../../variants/variants.module.js'; // ✅
import { DiscountProcessor } from './discount.processor.js';
import { PrismaModule } from '../../../prisma/prisma.module.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'discount-queue',
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: { count: 1000, age: 3600 },
        removeOnFail: { count: 5000 },
      },
    }),
    VariantsModule,
    PrismaModule,
  ],
  providers: [DiscountQueueService, DiscountProcessor],
  exports: [DiscountQueueService],
})
export class DiscountQueueModule { }