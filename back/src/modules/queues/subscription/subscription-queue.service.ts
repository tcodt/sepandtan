import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  SUBSCRIPTION_QUEUE, SUBSCRIPTION_SCAN_CRON, SUBSCRIPTION_SCAN_JOB,
  SUBSCRIPTION_SCAN_TZ, SUBSCRIPTION_SCHEDULER_ID,
} from './subscription.constants.js';

@Injectable()
export class SubscriptionQueueService implements OnModuleInit {
  private readonly logger = new Logger(SubscriptionQueueService.name);
  constructor(@InjectQueue(SUBSCRIPTION_QUEUE) private readonly queue: Queue) {}

  async onModuleInit() {
    try {
      await this.queue.waitUntilReady();
      // idempotent: با N instance هم فقط یک scheduler در Redis وجود دارد
      await this.queue.upsertJobScheduler(
        SUBSCRIPTION_SCHEDULER_ID,
        { pattern: SUBSCRIPTION_SCAN_CRON, tz: SUBSCRIPTION_SCAN_TZ },
        {
          name: SUBSCRIPTION_SCAN_JOB,
          data: {},
          opts: { removeOnComplete: { count: 5 }, removeOnFail: { count: 20 } },
        },
      );
      this.logger.log('subscription lifecycle scheduler ready');
    } catch (e) {
      this.logger.error('subscription-queue redis failed', e as Error);
    }
  }
}