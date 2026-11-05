import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import { SETTLEMENT_QUEUE } from './settlement.constants.js';

@Injectable()
export class SettlementQueueService implements OnModuleInit {
  private readonly logger = new Logger(SettlementQueueService.name);

  constructor(
    @InjectQueue(SETTLEMENT_QUEUE) private readonly queue: Queue,
  ) { }
  async onModuleInit() {
    try {
      await this.queue.waitUntilReady();
      this.logger.log('settlement-queue ready');

      await this.queue.upsertJobScheduler(
        'settle-due-scan-scheduler',
        { every: 6 * 60 * 60 * 1000 }, // ۶ ساعت
        {
          name: 'settle-due-scan',
          data: {},
        },
      );
    } catch (e) {
      this.logger.error('settlement-queue redis failed', e);
    }
  }

  private jobId(walletTransactionId: string) {
    return `settle-${walletTransactionId}`;
  }

  /**
   * زمان settlementDate (معمولاً returnDeadline) job زمان‌بندی می‌شود
   */
  async scheduleSettlement(
    walletTransactionId: string,
    settlementDate: Date | null | undefined,
  ) {
    if (!settlementDate) {
      this.logger.warn(
        `no settlementDate for tx=${walletTransactionId}, skip schedule`,
      );
      return;
    }

    const delay = settlementDate.getTime() - Date.now();
    const id = this.jobId(walletTransactionId);

    // اگر job قبلی بود جایگزین شود
    const existing = await this.queue.getJob(id);
    if (existing) {
      await existing.remove();
    }

    if (delay <= 0) {
      // موعد گذشته → فوری در صف
      await this.queue.add(
        'settle-seller',
        { walletTransactionId },
        { jobId: id, removeOnComplete: true },
      );
      return;
    }

    await this.queue.add(
      'settle-seller',
      { walletTransactionId },
      {
        jobId: id,
        delay,
        removeOnComplete: true,
        removeOnFail: { age: 7 * 24 * 3600 },
      },
    );
  }

  async cancelSettlement(walletTransactionId: string) {
    const id = this.jobId(walletTransactionId);
    const job = await this.queue.getJob(id);
    if (job) {
      await job.remove();
    }
  }

  /** برای چند تراکنش یک سفارش */
  async cancelMany(walletTransactionIds: string[]) {
    await Promise.allSettled(
      walletTransactionIds.map((id) => this.cancelSettlement(id)),
    );
  }
}