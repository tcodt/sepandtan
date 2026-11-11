import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  PENDING_GRACE_DAYS, SUBSCRIPTION_BATCH, SUBSCRIPTION_MAX_BATCHES_PER_RUN,
  SUBSCRIPTION_QUEUE, SUBSCRIPTION_SCAN_JOB,
} from './subscription.constants.js';

type CountRow = { n: number };

@Processor(SUBSCRIPTION_QUEUE, { concurrency: 1 })
export class SubscriptionLifecycleProcessor extends WorkerHost {
  private readonly logger = new Logger(SubscriptionLifecycleProcessor.name);
  constructor(private readonly prisma: PrismaService) { super(); }

  async process(job: Job) {
    if (job.name !== SUBSCRIPTION_SCAN_JOB) return { skipped: true };
    return this.run();
  }

  async run() {
    // ترتیب مهم است: اول لغو قدیمی‌ها، بعد trial→pending (هیچ اشتراکی در یک اجرا دو پله نمی‌پرد)
    const cancelled = await this.loop(() => this.cancelStalePending());
    const pending = await this.loop(() => this.trialToPending());
    const expired = await this.loop(() => this.expireActive());
    if (cancelled || pending || expired) {
      this.logger.log(`subscriptions → cancelled=${cancelled} pending=${pending} expired=${expired}`);
    }
    return { cancelled, pending, expired };
  }

  /** هر batch یک statement است؛ تا وقتی batch پر برمی‌گردد ادامه می‌دهیم (با سقف) */
  private async loop(step: () => Promise<number>) {
    let total = 0;
    for (let i = 0; i < SUBSCRIPTION_MAX_BATCHES_PER_RUN; i++) {
      const n = await step();
      total += n;
      if (n < SUBSCRIPTION_BATCH) break;
    }
    return total;
  }

  /** ۲) PENDING که trialش بیش از N روز پیش تمام شده → CANCELLED + بستن سفارش/پرداخت معلق */
  private async cancelStalePending(): Promise<number> {
    const [r] = await this.prisma.$queryRaw<CountRow[]>`
      WITH due AS (
        SELECT id FROM subscription
        WHERE status = 'PENDING'
          AND trial_ends_at IS NOT NULL
          AND trial_ends_at <= now() - (${PENDING_GRACE_DAYS}::int * interval '1 day')
        ORDER BY trial_ends_at
        LIMIT ${SUBSCRIPTION_BATCH}::int
        FOR UPDATE SKIP LOCKED
      ),
      cancelled AS (
        UPDATE subscription s
        SET status = 'CANCELLED', cancelled_at = now(), updated_at = now()
        FROM due WHERE s.id = due.id
        RETURNING s.id
      ),
      so AS (
        UPDATE service_orders o SET status = 'CANCELLED', updated_at = now()
        FROM cancelled c
        WHERE o.subscription_id = c.id AND o.status = 'PENDING_PAYMENT'
        RETURNING o.id
      ),
      pay AS (
        UPDATE payments p SET status = 'FAILED', error_message = 'subscription cancelled (unpaid)'
        FROM cancelled c
        WHERE p.subscription_id = c.id AND p.status = 'PENDING'
        RETURNING p.id
      )
      SELECT (SELECT count(*) FROM cancelled)::int AS n`;
    return r?.n ?? 0;
  }

  /** ۱) TRIALING که trialش تمام شده → PENDING (منتظر پرداخت) */
  private async trialToPending(): Promise<number> {
    const [r] = await this.prisma.$queryRaw<CountRow[]>`
      WITH due AS (
        SELECT id FROM subscription
        WHERE status = 'TRIALING' AND trial_ends_at <= now()
        ORDER BY trial_ends_at
        LIMIT ${SUBSCRIPTION_BATCH}::int
        FOR UPDATE SKIP LOCKED
      ),
      done AS (
        UPDATE subscription s SET status = 'PENDING', updated_at = now()
        FROM due WHERE s.id = due.id
        RETURNING s.id
      )
      SELECT (SELECT count(*) FROM done)::int AS n`;
    return r?.n ?? 0;
  }

  /** (پیشنهادی) ACTIVE تمام‌شده → EXPIRED؛ از ایندکس (status, endsAt) استفاده می‌کند */
  private async expireActive(): Promise<number> {
    const [r] = await this.prisma.$queryRaw<CountRow[]>`
      WITH due AS (
        SELECT id FROM subscription
        WHERE status = 'ACTIVE' AND ends_at <= now()
        ORDER BY ends_at
        LIMIT ${SUBSCRIPTION_BATCH}::int
        FOR UPDATE SKIP LOCKED
      ),
      done AS (
        UPDATE subscription s SET status = 'EXPIRED', updated_at = now()
        FROM due WHERE s.id = due.id
        RETURNING s.id
      )
      SELECT (SELECT count(*) FROM done)::int AS n`;
    return r?.n ?? 0;
  }
}