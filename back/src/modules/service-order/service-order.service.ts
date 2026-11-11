import {
  BadRequestException, ConflictException, Injectable,
  InternalServerErrorException, NotFoundException,
} from '@nestjs/common';
import { randomBytes, randomUUID } from 'crypto';
import { PaymentMethod, Prisma, StatusDiscount } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PayPlanDto, PaySubscriptionDto, RefundDto } from './dto/service-order.dto.js';

// ─────────── ثابت‌ها و ابزار پول (Decimal، هرگز float) ───────────
type Dec = Prisma.Decimal;
const REFERRAL_PERCENT = 5;
const REFERRAL_WINDOW_MS = 2 * 365 * 24 * 3600 * 1000;
const DAY_MS = 24 * 3600 * 1000;
const ZERO = new Prisma.Decimal(0);
const D = (v?: Prisma.Decimal | number | string | null) => new Prisma.Decimal(v ?? 0);
const R0 = (v: Dec) => v.toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
const isPercent = (t: unknown) => String(t).toLowerCase() === 'percentage';
/** سقف تخفیف: هرگز بیشتر از base و بیشتر از maxDiscount نمی‌شود */
const cap = (base: Dec, type: unknown, value: Dec, max: Dec | null) => {
  if (base.lte(0)) return ZERO;
  let a = isPercent(type) ? base.mul(value).div(100) : value;
  if (max?.gt(0)) a = Prisma.Decimal.min(a, max);
  return Prisma.Decimal.min(Prisma.Decimal.max(a, ZERO), base).toDecimalPlaces(0, Prisma.Decimal.ROUND_FLOOR);
};
const byId = <T extends [string, ...unknown[]]>(a: T, b: T) => (a[0] < b[0] ? -1 : 1);

const TEMPLATE_SELECT = { id: true, title: true, price: true, discountPrice: true, discountExpired: true } as const;
const PENDING_PAYMENT_SELECT = { where: { status: 'PENDING' as const }, select: { id: true }, take: 1 };

/** ورودی همه محاسبات پول؛ هم از قیمت‌گذاری (initiate) هم از سفارش ذخیره‌شده (complete) ساخته می‌شود */
interface Priced {
  type: 'PLAN' | 'SUBSCRIPTION';
  userId: string;
  buyerWalletId: string;
  coachId?: string; coachUserId?: string; coachWalletId?: string;
  planRequestId?: string; subscriptionId?: string; durationDays?: number;
  originalAmount: Dec; discountAmount: Dec;
  gross: Dec;                 // مبلغ پرداختی مشتری
  tax: Dec;
  commission: Dec;            // کمیسیون کامل (قبل از تخفیف کمیسیون)
  commissionDiscount: Dec;
  coachNet: Dec;
  referral: { userId: string; walletId: string; amount: Dec } | null;
  systemDiscount: Dec;        // تخفیفی که پلتفرم هزینه‌اش را می‌دهد → withdrawBalance
  codeId: string | null;
  codeUsageAmount: Dec;
  snapshot: Record<string, unknown>;
}
type Existing = { id: string; status: string; paymentId: string | null } | null;

@Injectable()
export class ServiceOrderService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  private async platformWallet() {
    const id = await this.prisma.wallet.findFirst({ where: { isPlatform: true }, select: { id: true } })
    if (!id?.id) throw new ConflictException('حساب پلتفرم ساخته نشده لطفا حساب بسازید')
    return id?.id
  }

  private code(prefix: string) {
    return `${prefix}-${randomBytes(8).toString('hex').toUpperCase()}`;
  }

  private walletOf(w?: { id: string } | null) {
    if (!w) throw new InternalServerErrorException('ولت کاربر یافت نشد'); // طبق قرارداد: هر کاربر ولت دارد
    return w.id;
  }

  private toExisting(so?: { id: string; status: string; payments: { id: string }[] } | null): Existing {
    if (!so) return null;
    if (['PAID', 'PARTIALLY_REFUNDED', 'REFUNDED'].includes(so.status)) {
      throw new ConflictException('این سفارش قبلاً پرداخت شده است');
    }
    return { id: so.id, status: so.status, paymentId: so.payments[0]?.id ?? null };
  }

  // ─────────── کد تخفیف: همه شرط‌ها در یک کوئری ───────────
  private async loadDiscount(raw: string, userId: string, allowed: StatusDiscount[], coachId?: string) {
    const d = await this.prisma.discountCode.findUnique({
      where: { code: raw.trim().toUpperCase() },
      select: {
        id: true, code: true, type: true, status: true, value: true, minOrderAmount: true, maxDiscount: true,
        usageLimit: true, usedCount: true, perUserLimit: true, startsAt: true, endsAt: true, isActive: true,
        coaches: { where: { coachId: coachId ?? '' }, select: { coachId: true } },       // لینک مربی
        _count: { select: { usages: { where: { userId } } } },                           // مصرف این کاربر
      },
    });
    const now = Date.now();
    if (!d) throw new BadRequestException('کد تخفیف یافت نشد');
    if (!allowed.includes(d.status)) throw new BadRequestException('این کد تخفیف برای این خرید قابل استفاده نیست');
    if (!d.isActive) throw new BadRequestException('کد تخفیف غیرفعال است');
    if (now < d.startsAt.getTime()) throw new BadRequestException('کد تخفیف هنوز فعال نشده است');
    if (now > d.endsAt.getTime()) throw new BadRequestException('کد تخفیف منقضی شده است');
    if (d.usageLimit > 0 && d.usedCount >= d.usageLimit) throw new BadRequestException('ظرفیت استفاده از این کد تکمیل شده است');
    if (d.perUserLimit > 0 && d._count.usages >= d.perUserLimit) throw new BadRequestException('شما بیش از حد مجاز از این کد استفاده کرده‌اید');
    if (d.status === 'COACH' && !d.coaches.length) throw new BadRequestException('این کد تخفیف برای این مربی فعال نیست');
    return d;
  }

  // ─────────── قیمت‌گذاری برنامه مربی ───────────
  private async pricePlan(userId: string, planRequestId: string, rawCode?: string) {
    const req = await this.prisma.planRequest.findFirst({
      where: { id: planRequestId, userId },
      select: {
        id: true, status: true, coachId: true,
        workoutTemplate: { select: TEMPLATE_SELECT },
        dietTemplate: { select: TEMPLATE_SELECT },
        coach: { select: { userId: true, commissionRate: true, taxRate: true, user: { select: { wallet: { select: { id: true } } } } } },
        user: {
          select: {
            referredAt: true,
            wallet: { select: { id: true } },
            referredBy: { select: { id: true, status: true, coach: { select: { id: true } }, wallet: { select: { id: true } } } },
          },
        },
        serviceOrder: { select: { id: true, status: true, payments: PENDING_PAYMENT_SELECT } },
      },
    });
    if (!req) throw new NotFoundException('درخواست یافت نشد');
    if (req.status !== 'ACCEPTED') throw new BadRequestException('فقط بعد از تأیید مربی می‌توانید پرداخت کنید');
    if (req.coach.userId === userId) throw new BadRequestException('خرید از خودتان ممکن نیست');
    const existing = this.toExisting(req.serviceOrder);

    // 1) قیمت قالب‌ها (تخفیف خود قالب اگر منقضی نشده)
    const now = new Date();
    const lines: { kind: string; templateId: string; title: string; listPrice: string; salePrice: string }[] = [];
    let original = ZERO, sub = ZERO;
    for (const [kind, t] of [['WORKOUT', req.workoutTemplate], ['DIET', req.dietTemplate]] as const) {
      if (!t) continue;
      const list = D(t.price);
      const onSale = t.discountPrice != null && (!t.discountExpired || t.discountExpired > now);
      const sale = onSale ? Prisma.Decimal.min(D(t.discountPrice), list) : list;
      lines.push({ kind, templateId: t.id, title: t.title, listPrice: list.toFixed(2), salePrice: sale.toFixed(2) });
      original = original.add(list); sub = sub.add(sale);
    }
    if (!lines.length) throw new BadRequestException('هیچ برنامه‌ای برای پرداخت مشخص نشده');

    // 2) کد تخفیف (فقط یکی): COACH از مربی کم می‌شود، COMMISSION از کمیسیون (پلتفرم)
    const disc = rawCode ? await this.loadDiscount(rawCode, userId, ['COACH', 'COMMISSION'], req.coachId) : null;
    if (disc && sub.lt(D(disc.minOrderAmount))) throw new BadRequestException('مبلغ سفارش کمتر از حداقل مبلغ این کد تخفیف است');
    const maxD = disc?.maxDiscount != null ? D(disc.maxDiscount) : null;
    const codeDisc = disc?.status === 'COACH' ? cap(sub, disc.type, D(disc.value), maxD) : ZERO;

    // 3) مالیات روی قیمت اضافه می‌شود؛ کمیسیون روی net
    const net = R0(sub.sub(codeDisc));
    const taxRate = D(req.coach.taxRate), commissionRate = D(req.coach.commissionRate);
    const tax = R0(net.mul(taxRate).div(100));
    const commission = R0(net.mul(commissionRate).div(100));

    let commDisc = ZERO;
    if (disc?.status === 'COMMISSION') {
      if (!isPercent(disc.type)) throw new BadRequestException('تخفیف کمیسیون فقط باید درصدی باشد');
      commDisc = R0(net.mul(Prisma.Decimal.min(commissionRate, D(disc.value))).div(100));
      if (maxD?.gt(0)) commDisc = Prisma.Decimal.min(commDisc, maxD);
      commDisc = Prisma.Decimal.min(commDisc, commission); // هرگز بیشتر از خود کمیسیون نمی‌شود
    }

    const gross = net.add(tax).sub(commDisc);
    if (gross.lte(0)) throw new BadRequestException('مبلغ قابل پرداخت صفر است (سفارش رایگان پشتیبانی نمی‌شود)');
    const effComm = commission.sub(commDisc);
    const coachNet = gross.sub(effComm).sub(tax); // = net - commission

    // 4) پاداش معرفی: از کمیسیون پلتفرم؛ هرگز بیشتر از کمیسیون مؤثر نمی‌شود
    const ref = req.user.referredBy;
    let referral: Priced['referral'] = null;
    if (
      ref && req.user.referredAt && now.getTime() - req.user.referredAt.getTime() <= REFERRAL_WINDOW_MS &&
      ref.status === 'ACTIVE' && ref.coach && ref.id !== req.coach.userId && ref.id !== userId && ref.wallet
    ) {
      const amount = Prisma.Decimal.min(R0(net.mul(REFERRAL_PERCENT).div(100)), effComm);
      if (amount.gt(0)) referral = { userId: ref.id, walletId: ref.wallet.id, amount };
    }

    const codeUsage = disc?.status === 'COACH' ? codeDisc : commDisc;
    const breakdown: { source: string; code?: string; amount: string }[] = [];
    const tplDisc = original.sub(sub);
    if (tplDisc.gt(0)) breakdown.push({ source: 'TEMPLATE', amount: tplDisc.toFixed(2) });
    if (disc && codeUsage.gt(0)) breakdown.push({ source: disc.status, code: disc.code, amount: codeUsage.toFixed(2) });

    const priced: Priced = {
      type: 'PLAN', userId, buyerWalletId: this.walletOf(req.user.wallet),
      coachId: req.coachId, coachUserId: req.coach.userId, coachWalletId: this.walletOf(req.coach.user.wallet),
      planRequestId: req.id,
      originalAmount: original, discountAmount: original.sub(net).add(commDisc),
      gross, tax, commission, commissionDiscount: commDisc, coachNet, referral,
      systemDiscount: disc?.status === 'COMMISSION' ? commDisc : ZERO,
      codeId: disc?.id ?? null, codeUsageAmount: codeUsage,
      snapshot: {
        kind: 'PLAN', lines, breakdown,
        commissionRate: commissionRate.toFixed(2), taxRate: taxRate.toFixed(2),
        referral: referral && { userId: referral.userId, walletId: referral.walletId },
        systemDiscount: (disc?.status === 'COMMISSION' ? commDisc : ZERO).toFixed(2),
        codeUsageAmount: codeUsage.toFixed(2),
      },
    };
    this.assertLedger(priced);

    // نمای مجاز برای مشتری (بدون کمیسیون / پاداش / سهم مربی)
    const view = {
      planRequestId: req.id, lines, originalAmount: original, discountAmount: priced.discountAmount,
      subtotal: net, taxAmount: tax, payableAmount: gross, discountBreakdown: breakdown,
      discountCode: disc?.code ?? null,
    };
    return { priced, existing, view };
  }

  // ─────────── قیمت‌گذاری اشتراک ───────────
  private async priceSubscription(userId: string, subscriptionId: string, rawCode?: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id: subscriptionId, userId },
      select: {
        id: true, status: true,
        plan: { select: { id: true, title: true, price: true, durationDays: true, isActive: true } },
        user: { select: { wallet: { select: { id: true } } } },
        serviceOrder: { select: { id: true, status: true, payments: PENDING_PAYMENT_SELECT } },
      },
    });
    if (!sub) throw new NotFoundException('اشتراک یافت نشد');
    if (sub.status !== 'TRIALING' && sub.status !== 'PENDING') throw new BadRequestException('این اشتراک قابل پرداخت نیست');
    if (!sub.plan.isActive) throw new BadRequestException('این پلن غیرفعال است');
    const existing = this.toExisting(sub.serviceOrder);

    const original = D(sub.plan.price);
    const disc = rawCode ? await this.loadDiscount(rawCode, userId, ['PLAN']) : null;
    if (disc && original.lt(D(disc.minOrderAmount))) throw new BadRequestException('مبلغ پلن کمتر از حداقل مبلغ این کد تخفیف است');
    const discAmount = disc ? cap(original, disc.type, D(disc.value), disc.maxDiscount != null ? D(disc.maxDiscount) : null) : ZERO;
    const gross = R0(original.sub(discAmount));
    if (gross.lte(0)) throw new BadRequestException('مبلغ قابل پرداخت صفر است (سفارش رایگان پشتیبانی نمی‌شود)');

    const breakdown = disc && discAmount.gt(0) ? [{ source: 'PLAN', code: disc.code, amount: discAmount.toFixed(2) }] : [];
    const priced: Priced = {
      type: 'SUBSCRIPTION', userId, buyerWalletId: this.walletOf(sub.user.wallet),
      subscriptionId: sub.id, durationDays: sub.plan.durationDays,
      originalAmount: original, discountAmount: discAmount,
      gross, tax: ZERO, commission: ZERO, commissionDiscount: ZERO, coachNet: ZERO, referral: null,
      systemDiscount: discAmount, codeId: disc?.id ?? null, codeUsageAmount: discAmount,
      snapshot: {
        kind: 'SUBSCRIPTION', planId: sub.plan.id, planTitle: sub.plan.title, durationDays: sub.plan.durationDays,
        breakdown, referral: null, systemDiscount: discAmount.toFixed(2), codeUsageAmount: discAmount.toFixed(2),
      },
    };
    const view = {
      subscriptionId: sub.id, planTitle: sub.plan.title, originalAmount: original,
      discountAmount: discAmount, payableAmount: gross, discountBreakdown: breakdown, discountCode: disc?.code ?? null,
    };
    return { priced, existing, view };
  }

  /** بستن دفتر کل: هر ریال پرداختی دقیقاً به یک نفر می‌رسد. قبل از هر نوشتن چک می‌شود */
  private assertLedger(p: Priced) {
    if (p.type === 'SUBSCRIPTION') {
      if (!p.gross.eq(p.originalAmount.sub(p.discountAmount))) throw new InternalServerErrorException('ناسازگاری مبلغ اشتراک');
      return;
    }
    const effComm = p.commission.sub(p.commissionDiscount);
    const refAmt = p.referral?.amount ?? ZERO;
    if (
      effComm.lt(0) || p.coachNet.lt(0) || refAmt.gt(effComm) ||
      !p.gross.eq(p.coachNet.add(effComm).add(p.tax))
    ) throw new InternalServerErrorException('ناسازگاری مبالغ مالی سفارش');
  }

  // ─────────── API عمومی: quote ───────────
  async quotePlanRequest(userId: string, planRequestId: string, discountCode?: string) {
    return (await this.pricePlan(userId, planRequestId, discountCode)).view;
  }
  async quoteSubscription(userId: string, subscriptionId: string, discountCode?: string) {
    return (await this.priceSubscription(userId, subscriptionId, discountCode)).view;
  }

  // ─────────── initiate ───────────
  async initiatePlanPayment(userId: string, dto: PayPlanDto) {
    const { priced, existing } = await this.pricePlan(userId, dto.planRequestId, dto.discountCode);
    return this.persist(priced, existing, dto.method);
  }
  async initiateSubscriptionPayment(userId: string, dto: PaySubscriptionDto) {
    const { priced, existing } = await this.priceSubscription(userId, dto.subscriptionId, dto.discountCode);
    return this.persist(priced, existing, dto.method);
  }

  /**
   * ساخت/آپدیت ServiceOrder + Payment (nested، یک فراخوانی).
   * سفارش PENDING قبلی با قیمت/کد جدید آپدیت می‌شود (ساخت دوباره ندارد).
   * WALLET: سفارش مستقیم PAID ساخته می‌شود و پول همان‌جا جابه‌جا می‌شود.
   */
  private async persist(p: Priced, existing: Existing, method: PaymentMethod) {
    const isWallet = method === 'WALLET';
    const platformId = await this.platformWallet(); // cache؛ صفر کوئری بعد از بار اول
    const paymentId = existing?.paymentId ?? randomUUID();
    const paidAt = isWallet ? new Date() : null;

    const amounts = {
      originalAmount: p.originalAmount, discountAmount: p.discountAmount, taxAmount: p.tax,
      commissionAmount: p.commission, commissionDiscountAmount: p.commissionDiscount,
      referralAmount: p.referral?.amount ?? ZERO, payableAmount: p.gross, coachNetAmount: p.coachNet,
      discountCodeId: p.codeId, snapshot: p.snapshot as Prisma.InputJsonValue,
      status: (isWallet ? 'PAID' : 'PENDING_PAYMENT') as 'PAID' | 'PENDING_PAYMENT', paidAt,
    };
    const payment = {
      amount: p.gross, method, status: (isWallet ? 'PAID' : 'PENDING') as 'PAID' | 'PENDING', paidAt,
      gatewayRef: isWallet ? `wallet-${paymentId}` : null,
      planRequestId: p.planRequestId ?? null, subscriptionId: p.subscriptionId ?? null,
    };

    return this.prisma.$transaction(async (tx) => {
      const order = existing
        ? await tx.serviceOrder.update({
          // فقط وقتی هنوز پرداخت نشده؛ اگر وسط کار وضعیتش عوض شده باشد P2025
          where: { id: existing.id, status: { in: ['PENDING_PAYMENT', 'CANCELLED', 'FAILED'] } },
          data: {
            ...amounts,
            payments: existing.paymentId
              ? { update: { where: { id: existing.paymentId }, data: payment } }
              : { create: { id: paymentId, ...payment } },
          },
          select: { id: true },
        })
        : await tx.serviceOrder.create({
          data: {
            type: p.type, userId: p.userId, coachId: p.coachId ?? null,
            planRequestId: p.planRequestId ?? null, subscriptionId: p.subscriptionId ?? null,
            ...amounts,
            payments: { create: { id: paymentId, ...payment } },
          },
          select: { id: true },
        });

      if (isWallet) await this.applyPayment(tx, p, order.id, method, platformId);

      return isWallet
        ? { orderId: order.id, paymentId, status: 'PAID' as const }
        : { orderId: order.id, paymentId, amount: p.gross, status: 'PENDING_PAYMENT' as const };
    }, { maxWait: 5_000, timeout: 15_000 });
  }

  // ─────────── تکمیل پرداخت (callback درگاه با verify / تایید ادمین) ───────────
  async completePayment(paymentId: string, gatewayRef: string) {
    const platformId = await this.platformWallet();
    return this.prisma.$transaction(async (tx) => {
      // یک خواندن با همه join‌ها
      const pay = await tx.payment.findUnique({
        where: { id: paymentId },
        select: {
          status: true, method: true, amount: true,
          serviceOrder: {
            select: {
              id: true, type: true, status: true, userId: true, coachId: true,
              planRequestId: true, subscriptionId: true,
              originalAmount: true, discountAmount: true, taxAmount: true, commissionAmount: true,
              commissionDiscountAmount: true, referralAmount: true, payableAmount: true, coachNetAmount: true,
              discountCodeId: true, snapshot: true,
              user: { select: { wallet: { select: { id: true } } } },
              coach: { select: { userId: true, user: { select: { wallet: { select: { id: true } } } } } },
            },
          },
        },
      });
      const o = pay?.serviceOrder;
      if (!pay || !o) throw new NotFoundException('پرداخت یافت نشد');
      if (pay.status === 'PAID') return { success: true, idempotent: true };
      if (o.status !== 'PENDING_PAYMENT') throw new BadRequestException('سفارش قابل پرداخت نیست');
      if (!D(pay.amount).eq(D(o.payableAmount))) throw new InternalServerErrorException('مبلغ پرداخت با سفارش برابر نیست');

      // claim اتمیک: فقط یک درخواست برنده می‌شود (وب‌هوک تکراری → idempotent)
      const claimed = await tx.serviceOrder.updateMany({
        where: { id: o.id, status: 'PENDING_PAYMENT' },
        data: { status: 'PAID', paidAt: new Date() },
      });
      if (!claimed.count) return { success: true, idempotent: true };
      await tx.payment.update({ where: { id: paymentId }, data: { status: 'PAID', gatewayRef, paidAt: new Date() } });

      const s = o.snapshot as any;
      const p: Priced = {
        type: o.type, userId: o.userId, buyerWalletId: this.walletOf(o.user.wallet),
        coachId: o.coachId ?? undefined, coachUserId: o.coach?.userId,
        coachWalletId: o.coach ? this.walletOf(o.coach.user.wallet) : undefined,
        planRequestId: o.planRequestId ?? undefined, subscriptionId: o.subscriptionId ?? undefined,
        durationDays: s?.durationDays,
        originalAmount: D(o.originalAmount), discountAmount: D(o.discountAmount),
        gross: D(o.payableAmount), tax: D(o.taxAmount), commission: D(o.commissionAmount),
        commissionDiscount: D(o.commissionDiscountAmount), coachNet: D(o.coachNetAmount),
        referral: s?.referral ? { userId: s.referral.userId, walletId: s.referral.walletId, amount: D(o.referralAmount) } : null,
        systemDiscount: D(s?.systemDiscount), codeId: o.discountCodeId, codeUsageAmount: D(s?.codeUsageAmount),
        snapshot: s,
      };
      this.assertLedger(p);
      await this.applyPayment(tx, p, o.id, pay.method, platformId);
      return { success: true, orderId: o.id };
    }, { maxWait: 5_000, timeout: 15_000 });
  }

  // ─────────── تنها مسیر جابه‌جایی پول (WALLET و درگاه) ───────────
  private async applyPayment(
    tx: Prisma.TransactionClient, p: Priced, orderId: string, method: PaymentMethod, platformId: string,
  ) {
    const isWallet = method === 'WALLET';

    // 1) کد تخفیف اول (fail-fast). UPDATE ردیف کد را قفل می‌کند → شمارش per-user بعد از آن دقیق است
    if (p.codeId) {
      const r = await tx.$queryRaw<{ per_user_limit: number }[]>`
        UPDATE discount_codes SET used_count = used_count + 1, updated_at = now()
        WHERE id = ${p.codeId} AND is_active = true AND (usage_limit = 0 OR used_count < usage_limit)
        RETURNING per_user_limit`;
      if (!r.length) throw new BadRequestException('ظرفیت استفاده از این کد تخفیف تکمیل شده است');
      if (r[0].per_user_limit > 0) {
        const used = await tx.discountCodeUsage.count({ where: { discountCodeId: p.codeId, userId: p.userId } });
        if (used >= r[0].per_user_limit) throw new BadRequestException('شما بیش از حد مجاز از این کد استفاده کرده‌اید');
      }
      await tx.discountCodeUsage.create({ data: { discountCodeId: p.codeId, userId: p.userId, amount: p.codeUsageAmount } });
    }

    // 2) ولت‌ها به ترتیب id (ترتیب ثابت قفل ⇒ بدون deadlock). خریدار/مربی/معرف همیشه متفاوت‌اند
    const ops = new Map<string, { debit: Dec; credit: Dec }>();
    const add = (id: string, k: 'debit' | 'credit', v: Dec) => {
      const o = ops.get(id) ?? { debit: ZERO, credit: ZERO };
      o[k] = o[k].add(v); ops.set(id, o);
    };
    if (isWallet) add(p.buyerWalletId, 'debit', p.gross);
    if (p.type === 'PLAN') add(p.coachWalletId!, 'credit', p.coachNet);       // مربی: آنی، بدون pending
    if (p.referral) add(p.referral.walletId, 'credit', p.referral.amount);
    for (const [id, o] of [...ops].sort(byId)) {
      if (o.debit.gt(0)) {
        // کسر اتمیک شرطی: بدون read-then-write → ضد overspend همزمان

        const r = await tx.wallet.updateMany({ where: { id, balance: { gte: o.debit } }, data: { balance: { decrement: o.debit } } });
        if (!r.count) throw new BadRequestException('موجودی کیف پول کافی نیست');
      } else if (o.credit.gt(0)) {

        await tx.wallet.update({ where: { id }, data: { balance: { increment: o.credit } } });
      }
    }

    // 3) همه تراکنش‌ها: یک INSERT
    const rows: Prisma.WalletTransactionCreateManyInput[] = [];
    const base = { serviceOrderId: orderId, status: 'COMPLETED' as const };
    const buyer = { ...base, userId: p.userId, walletId: p.buyerWalletId, amount: p.gross };
    if (!isWallet) rows.push({ ...buyer, type: 'DEPOSIT', trackingCode: this.code('DEP'), description: 'واریز از درگاه' });
    rows.push(p.type === 'PLAN'
      ? { ...buyer, type: 'PURCHASE', trackingCode: this.code('PRC'), description: 'خرید برنامه مربی' }
      : { ...buyer, type: 'SERVICE_PACKAGE', trackingCode: this.code('SRV'), description: 'خرید اشتراک' });

    if (p.type === 'PLAN') {
      const coach = { ...base, userId: p.coachUserId!, walletId: p.coachWalletId! };
      const effComm = p.commission.sub(p.commissionDiscount);
      rows.push(
        { ...coach, type: 'COACH_SETTLEMENT', amount: p.gross, trackingCode: this.code('CST') },
        { ...coach, type: 'COMMISSION', amount: effComm, trackingCode: this.code('COM'), description: p.commissionDiscount.gt(0) ? 'پس از تخفیف کمیسیون' : null },
        { ...coach, type: 'TAX', amount: p.tax, trackingCode: this.code('TAX') }, // حتی با ۰ (برای نمودار)
      );
      if (p.referral) {
        rows.push({ ...base, userId: p.referral.userId, walletId: p.referral.walletId, type: 'REFERRAL_BONUS', amount: p.referral.amount, trackingCode: this.code('REF') });
      }
    }
    await tx.walletTransaction.createMany({ data: rows });

    // 4) وضعیت دامنه
    if (p.type === 'PLAN') {
      await tx.planRequest.update({ where: { id: p.planRequestId! }, data: { status: 'PAID' } });
    } else {
      const now = new Date();
      const r = await tx.subscription.updateMany({
        where: { id: p.subscriptionId!, status: { in: ['TRIALING', 'PENDING'] } },
        data: { status: 'ACTIVE', startsAt: now, endsAt: new Date(now.getTime() + p.durationDays! * DAY_MS), pricePaid: p.gross },
      });
      if (!r.count) throw new ConflictException('اشتراک دیگر قابل فعال‌سازی نیست');
    }

    // 5) ولت پلتفرم: آخرین قفل (hot row)، بدون هیچ تراکنشی
    const platformIn = p.type === 'PLAN'
      ? p.commission.sub(p.commissionDiscount).sub(p.referral?.amount ?? ZERO).add(p.tax) // کمیسیون خالص + مالیات
      : p.gross;                                                                         // اشتراک
    await tx.wallet.update({
      where: { id: platformId },
      data: {
        balance: { increment: platformIn },
        pendingBalance: { increment: p.tax },
        withdrawBalance: { increment: p.systemDiscount },
        frozenBalance: { increment: p.gross },
      },
    });
  }

  // ─────────── استرداد: فقط ثبت (پول کارت‌به‌کارت دستی برگردانده می‌شود) ───────────
  async refundPayment(paymentId: string, dto: RefundDto) {
    return this.prisma.$transaction(async (tx) => {
      const pay = await tx.payment.findUnique({
        where: { id: paymentId },
        select: {
          id: true, status: true,
          serviceOrder: { select: { id: true, userId: true, payableAmount: true, user: { select: { wallet: { select: { id: true } } } } } },
        },
      });
      const o = pay?.serviceOrder;
      if (!pay || !o) throw new NotFoundException('پرداخت یافت نشد');

      // claim: ردیف سفارش را قفل می‌کند → دو استرداد همزمان پشت هم اجرا می‌شوند (جمع از سقف رد نمی‌شود)
      const locked = await tx.serviceOrder.updateMany({
        where: { id: o.id, status: { in: ['PAID', 'PARTIALLY_REFUNDED'] } },
        data: { refundedAt: new Date() },
      });
      if (!locked.count) throw new BadRequestException('پرداخت قابل استرداد نیست');

      const payable = D(o.payableAmount);
      const already = D((await tx.walletTransaction.aggregate({
        where: { serviceOrderId: o.id, type: 'REFUND' }, _sum: { amount: true },
      }))._sum.amount);
      const amount = dto.amount ? D(dto.amount) : payable.sub(already);
      if (amount.lte(0) || already.add(amount).gt(payable)) throw new BadRequestException('مبلغ استرداد نامعتبر است');
      const full = already.add(amount).eq(payable);

      await tx.walletTransaction.create({
        data: {
          type: 'REFUND', status: 'COMPLETED', amount, trackingCode: this.code('RFD'),
          userId: o.userId, walletId: this.walletOf(o.user.wallet), serviceOrderId: o.id,
          description: `استرداد کارت‌به‌کارت${dto.reason ? ` - ${dto.reason}` : ''}`,
        },
      });
      await tx.serviceOrder.update({ where: { id: o.id }, data: { status: full ? 'REFUNDED' : 'PARTIALLY_REFUNDED' } });
      if (full) await tx.payment.update({ where: { id: pay.id }, data: { status: 'REFUNDED' } });
      return { success: true };
    });
  }
}