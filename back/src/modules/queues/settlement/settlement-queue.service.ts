import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bullmq';
import {
  SETTLEMENT_QUEUE,
  SETTLEMENT_SCAN_EVERY_MS,
  SETTLEMENT_SCAN_JOB,
  SETTLEMENT_SCHEDULER_ID,
} from './settlement.constants.js';

@Injectable()
export class SettlementQueueService implements OnModuleInit {
  private readonly logger = new Logger(SettlementQueueService.name);

  constructor(@InjectQueue(SETTLEMENT_QUEUE) private readonly queue: Queue) {}

  async onModuleInit() {
    try {
      await this.queue.waitUntilReady();
      // idempotent: با چند instance هم فقط یک scheduler وجود دارد.
      // تنها چیزی که این صف در Redis نگه می‌دارد همین scheduler + چند job اخیر است.
      await this.queue.upsertJobScheduler(
        SETTLEMENT_SCHEDULER_ID,
        { every: SETTLEMENT_SCAN_EVERY_MS },
        {
          name: SETTLEMENT_SCAN_JOB,
          data: {},
          opts: { removeOnComplete: { count: 5 }, removeOnFail: { count: 20 } },
        },
      );
      this.logger.log('settlement scan scheduler ready');
    } catch (e) {
      this.logger.error('settlement-queue redis failed', e as Error);
    }
  }

  // ───────────────────────────────────────────────────────────────
  // سازگاری با کد فعلی OrdersService: این متدها دیگر چیزی در Redis نمی‌نویسند.
  // تسویه فقط با scan ساعتی از روی DB انجام می‌شود. بعد از اینکه
  // فراخوانی‌ها را از orders.service حذف کردی، این سه متد را هم پاک کن.
  // ───────────────────────────────────────────────────────────────

  /** @deprecated دیگر job تأخیری برای هر سفارش ساخته نمی‌شود (scan ساعتی کافی است) */
  async scheduleSettlement(_walletTransactionId: string, _settlementDate?: Date | null) {
    return;
  }

  /** @deprecated برای لغو، status ردیف SALE_SETTLEMENT را در DB به FAILED تغییر بده */
  async cancelSettlement(_walletTransactionId: string) {
    return;
  }

  /** @deprecated مثل بالا */
  async cancelMany(_walletTransactionIds: string[]) {
    return;
  }
}
