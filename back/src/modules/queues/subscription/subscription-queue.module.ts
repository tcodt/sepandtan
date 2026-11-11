import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../../prisma/prisma.module.js';
import { SubscriptionLifecycleProcessor } from './subscription.processor.js';
import { SubscriptionQueueService } from './subscription-queue.service.js';
import { SUBSCRIPTION_QUEUE } from './subscription.constants.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SUBSCRIPTION_QUEUE,
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 60_000 },
        removeOnComplete: { count: 5 },
        removeOnFail: { count: 20, age: 7 * 24 * 3600 },
      },
    }),
    PrismaModule,
  ],
  providers: [SubscriptionQueueService, SubscriptionLifecycleProcessor],
})
export class SubscriptionQueueModule {}