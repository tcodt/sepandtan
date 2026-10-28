import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class DiscountQueueService {
  private readonly logger = new Logger(DiscountQueueService.name);
  constructor(@InjectQueue('discount-queue') private queue: Queue) { }

  async onModuleInit() {
    try {
      await this.queue.waitUntilReady();
      this.logger.log('✅ اتصال به Redis برقرار شد (discount-queue)');
    } catch (err) {
      this.logger.error('❌ اتصال به Redis برقرار نشد', err);
    }
  }

  async scheduleExpire(discountId: string, endDate: Date) {
    const delay = endDate.getTime() - Date.now();
    if (delay <= 0) return;

    await this.queue.add(
      'expire-discount',
      { discountId },
      {
        delay, jobId: `expire-${discountId}`,
        removeOnComplete: true,
        removeOnFail: {
          age: 24 * 60 * 60,
          count: 1000,
        },
      },
    );
  }

  async scheduleActivate(discountId: string, startDate: Date) {
    const delay = startDate.getTime() - Date.now();
    if (delay <= 0) return;

    await this.queue.add(
      'activate-discount',
      { discountId },
      {
        delay, jobId: `activate-${discountId}`,
        removeOnComplete: true,
        removeOnFail: {
          age: 24 * 60 * 60,
          count: 1000,
        },
      },
    );
  }

  async cancelJobs(discountId: string) {
    await Promise.allSettled([
      this.queue.remove(`activate-${discountId}`),
      this.queue.remove(`expire-${discountId}`),
    ]);
  }

  async enqueueSyncForProducts(productIds: string[]) {
    await this.queue.add(
      'sync-products',
      { productIds },
      {
        jobId: `sync-products-${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: {
          age: 24 * 60 * 60,
          count: 1000,
        },
      },
    );
  }

  async enqueueImmediateSync(discountId: string) {
    await this.queue.add(
      'sync-discount',
      { discountId },
      {
        jobId: `sync-${discountId}-${Date.now()}`,
        removeOnComplete: true,
        removeOnFail: {
          age: 24 * 60 * 60,
          count: 1000,
        },
      },
    );
  }
}