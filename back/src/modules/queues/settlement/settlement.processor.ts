import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Prisma } from '../../../generated/prisma/client.js';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  SETTLEMENT_BATCH,
  SETTLEMENT_MAX_BATCHES_PER_RUN,
  SETTLEMENT_QUEUE,
  SETTLEMENT_SCAN_JOB,
  SETTLEMENT_USE_ORDER_PAYOUT,
} from './settlement.constants.js';

@Processor(SETTLEMENT_QUEUE, { concurrency: 1 })
export class SettlementProcessor extends WorkerHost {
  private readonly logger = new Logger(SettlementProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job) {
    // jobهای تأخیری قدیمی (settle-seller) که هنوز در Redis مانده‌اند:
    // scan همه را پوشش می‌دهد، پس اینجا no-op است و خودشان پاک می‌شوند.
    if (job.name !== SETTLEMENT_SCAN_JOB) return { skipped: 'legacy' };
    return this.settleDue();
  }

  /**
   * هر batch = یک statement اتمیک (همه یا هیچ):
   *  due  : ردیف‌های سررسیدشده را قفل می‌کند. SKIP LOCKED یعنی چند instance همدیگر را بلاک نمی‌کنند
   *  done : status را COMPLETED می‌کند، فقط PENDING (ایدمپوتنت؛ ردیف FAILED رد می‌شود)
   *  agg  : مبلغ به تفکیک ولت جمع زده می‌شود
   *  upd  : pending → balance، یک UPDATE برای همه ولت‌ها
   */
  async settleDue() {
    // مبلغ خالص فروشنده: از Order.payoutAmount یا از خود ردیف تراکنش (به SETTLEMENT_USE_ORDER_PAYOUT نگاه کن)
    const amountExpr = SETTLEMENT_USE_ORDER_PAYOUT
      ? Prisma.sql`COALESCE(o.payout_amount, 0)`
      : Prisma.sql`wt.amount`;
    const joinExpr = SETTLEMENT_USE_ORDER_PAYOUT
      ? Prisma.sql`JOIN orders o ON o.id = wt.order_id`
      : Prisma.empty;

    let total = 0;
    for (let i = 0; i < SETTLEMENT_MAX_BATCHES_PER_RUN; i++) {
      const [res] = await this.prisma.$queryRaw<{ settled: number }[]>`
        WITH due AS (
          SELECT wt.id, wt.wallet_id, ${amountExpr} AS payout
          FROM wallet_transactions wt
          ${joinExpr}
          WHERE wt.type = 'SALE_SETTLEMENT'
            AND wt.status = 'PENDING'
            AND wt.settlement_date <= now()
          ORDER BY wt.settlement_date
          LIMIT ${SETTLEMENT_BATCH}::int
          FOR UPDATE OF wt SKIP LOCKED
        ),
        done AS (
          UPDATE wallet_transactions wt
          SET status = 'COMPLETED', updated_at = now()
          FROM due WHERE wt.id = due.id
          RETURNING due.wallet_id, due.payout
        ),
        agg AS (
          SELECT wallet_id, SUM(payout) AS amt FROM done GROUP BY wallet_id
        ),
        upd AS (
          UPDATE wallets w
          SET pending_balance = w.pending_balance - agg.amt,
              balance = w.balance + agg.amt,
              updated_at = now()
          FROM agg WHERE w.id = agg.wallet_id
          RETURNING w.id
        )
        SELECT (SELECT count(*) FROM done)::int AS settled`;

      const settled = res?.settled ?? 0;
      total += settled;
      if (settled < SETTLEMENT_BATCH) break;
    }

    if (total) this.logger.log(`settled ${total} seller payouts`);
    return { settled: total };
  }
}
