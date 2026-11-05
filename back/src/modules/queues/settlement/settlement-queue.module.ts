import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../../prisma/prisma.module.js';
import { SettlementProcessor } from './settlement.processor.js';
import { SettlementQueueService } from './settlement-queue.service.js';
import { SETTLEMENT_QUEUE } from './settlement.constants.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SETTLEMENT_QUEUE,
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 2000, age: 24 * 3600 },
        removeOnFail: { count: 5000 },
      },
    }),
    PrismaModule,
  ],
  providers: [SettlementQueueService, SettlementProcessor],
  exports: [SettlementQueueService],
})
export class SettlementQueueModule {}