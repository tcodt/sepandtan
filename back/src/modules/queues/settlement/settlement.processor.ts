import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { SETTLEMENT_QUEUE } from './settlement.constants.js';

@Processor(SETTLEMENT_QUEUE, {
  concurrency: 5, // با توجه به بار تنظیم کن
})
export class SettlementProcessor extends WorkerHost {
  private readonly logger = new Logger(SettlementProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<{ walletTransactionId?: string }>) {
    if (job.name === 'settle-due-scan') {
      return this.settleDueBatch(100);
    }
    if (job.name === 'settle-seller') {
      const { walletTransactionId } = job.data;
      if (!walletTransactionId) return;
      return this.settleOne(walletTransactionId);
    }
  }

  /**
   * اتمیک + idempotent: فقط PENDING + SALE_SETTLEMENT
   */
  async settleOne(walletTransactionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const row = await tx.walletTransaction.findUnique({
        where: { id: walletTransactionId },
        select: {
          id: true,
          type: true,
          status: true,
          amount: true,
          walletId: true,
          settlementDate: true,
        },
      });

      if (!row) {
        this.logger.warn(`tx not found ${walletTransactionId}`);
        return { skipped: true };
      }

      if (row.type !== 'SALE_SETTLEMENT') {
        return { skipped: true, reason: 'wrong_type' };
      }

      // قبلاً settle شده
      if (row.status === 'COMPLETED') {
        return { skipped: true, reason: 'already_completed' };
      }

      if (row.status !== 'PENDING') {
        return { skipped: true, reason: `status_${row.status}` };
      }

      // هنوز زود است (اسکن زودتر آمده)
      if (row.settlementDate && row.settlementDate.getTime() > Date.now()) {
        return { skipped: true, reason: 'too_early' };
      }

      const amount = new Prisma.Decimal(row.amount);
      if (amount.lte(0)) {
        await tx.walletTransaction.update({
          where: { id: row.id },
          data: { status: 'COMPLETED' },
        });
        return { skipped: true, reason: 'zero_amount' };
      }

      // فقط اگر pending کافی باشد — جلوگیری از منفی شدن
      const moved = await tx.wallet.updateMany({
        where: {
          id: row.walletId,
          pendingBalance: { gte: amount },
        },
        data: {
          pendingBalance: { decrement: amount },
          balance: { increment: amount },
        },
      });

      if (moved.count === 0) {
        // داده ناهماهنگ: job را fail کن تا retry شود / آلرت
        throw new Error(
          `insufficient pendingBalance for tx=${row.id} wallet=${row.walletId}`,
        );
      }

      // فقط اگر هنوز PENDING باشد (double-process)
      const updated = await tx.walletTransaction.updateMany({
        where: { id: row.id, status: 'PENDING' },
        data: { status: 'COMPLETED' },
      });

      if (updated.count === 0) {
        // کس دیگری settle کرده — rollback کیف پول در همین tx با throw
        throw new Error(`race on walletTransaction ${row.id}`);
      }

      this.logger.log(`settled ${row.id} amount=${amount.toFixed(2)}`);
      return { success: true };
    });
  }

  /**
   * Safety-net: تراکنش‌های عقب‌افتاده (اگر Redis job از بین رفت)
   * از SettlementQueueService یا یک Cron صدا بزن
   */
  async settleDueBatch(limit = 100) {
    const due = await this.prisma.walletTransaction.findMany({
      where: {
        type: 'SALE_SETTLEMENT',
        status: 'PENDING',
        settlementDate: { lte: new Date() },
      },
      select: { id: true },
      take: limit,
      orderBy: { settlementDate: 'asc' },
    });

    let ok = 0;
    let fail = 0;
    for (const row of due) {
      try {
        await this.settleOne(row.id);
        ok++;
      } catch (e) {
        fail++;
        this.logger.error(`batch settle fail ${row.id}`, e);
      }
    }
    return { ok, fail, scanned: due.length };
  }
}