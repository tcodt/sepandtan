// service-order.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { randomBytes } from 'crypto';

@Injectable()
export class ServiceOrderService {
  constructor(private readonly prisma: PrismaService) {}

  private d(n: number | string | Prisma.Decimal) {
    return new Prisma.Decimal(n);
  }

  private tracking(prefix: string) {
    return `${prefix}-${Date.now()}-${randomBytes(3).toString('hex')}`;
  }

  /** هر کاربر باید کیف پول داشته باشد */
  async ensureWallet(userId: string, tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    const existing = await db.wallet.findUnique({ where: { userId } });
    if (existing) return existing;
    return db.wallet.create({
      data: { userId, balance: 0, pendingBalance: 0 },
    });
  }

  /**
   * محاسبه قیمت PlanRequest بعد از ACCEPT
   */
  async quotePlanRequest(userId: string, planRequestId: string, discountCode?: string) {
    const req = await this.prisma.planRequest.findFirst({
      where: { id: planRequestId, userId },
      include: {
        workoutTemplate: true,
        dietTemplate: true,
        coach: {
          include: {
            user: { select: { id: true, commissionRate: true } },
          },
        },
      },
    });
    if (!req) throw new NotFoundException('درخواست یافت نشد');
    if (req.status !== 'ACCEPTED') {
      throw new BadRequestException('فقط بعد از تأیید مربی می‌توانید پرداخت کنید');
    }

    const lines: {
      kind: 'WORKOUT' | 'DIET';
      templateId: string;
      title: string;
      listPrice: Prisma.Decimal;
      salePrice: Prisma.Decimal;
    }[] = [];

    let original = this.d(0);

    const pushTemplate = (
      kind: 'WORKOUT' | 'DIET',
      t: {
        id: string;
        title: string;
        price: Prisma.Decimal;
        discountPrice: Prisma.Decimal | null;
        discountExpired: Date | null;
      } | null,
    ) => {
      if (!t) return;
      const list = this.d(t.price);
      const onSale =
        t.discountPrice != null &&
        (!t.discountExpired || t.discountExpired > new Date());
      const sale = onSale ? this.d(t.discountPrice!) : list;
      lines.push({
        kind,
        templateId: t.id,
        title: t.title,
        listPrice: list,
        salePrice: sale,
      });
      original = original.add(list);
    };

    pushTemplate('WORKOUT', req.workoutTemplate);
    pushTemplate('DIET', req.dietTemplate);

    if (lines.length === 0) {
      throw new BadRequestException('هیچ برنامه‌ای برای پرداخت مشخص نشده');
    }

    // بعد از تخفیف روی قالب
    let afterTemplate = lines.reduce(
      (s, l) => s.add(l.salePrice),
      this.d(0),
    );

    const discountBreakdown: {
      source: string;
      code?: string;
      amount: string;
    }[] = [];

    // اختلاف list vs sale به‌عنوان تخفیف مربی روی قالب
    const templateDisc = original.sub(afterTemplate);
    if (templateDisc.gt(0)) {
      discountBreakdown.push({
        source: 'TEMPLATE',
        amount: templateDisc.toFixed(2),
      });
    }

    let codeId: string | null = null;
    let payable = afterTemplate;

    if (discountCode) {
      const applied = await this.applyDiscountCode({
        code: discountCode,
        scopeHint: ['COACH', 'PLAN', 'PLATFORM'],
        coachId: req.coachId,
        amount: payable,
        userId,
      });
      payable = applied.payable;
      codeId = applied.discountCodeId;
      discountBreakdown.push(...applied.breakdown);
    }

    if (payable.lt(0)) payable = this.d(0);

    // کمیسیون: از Coach.commissionRate یا PlanRequest.commissionRate
    let commissionRate = this.d(
      req.commissionRate ?? req.coach.commissionRate ?? 0,
    );
    // اگر کد COMMISSION جدا خواستی اینجا rate را کم کن

    const taxRate = this.d(0); // در صورت نیاز از config
    const taxAmount = payable.mul(taxRate).div(100);
    const totalPayable = payable.add(taxAmount);

    const commissionAmount = totalPayable.mul(commissionRate).div(100);

    // پاداش معرفی
    const buyer = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referredById: true, referredAt: true },
    });
    let referralAmount = this.d(0);
    let referralUserId: string | null = null;

    if (buyer?.referredById && buyer.referredAt) {
      const twoYears = 1000 * 60 * 60 * 24 * 365 * 2;
      if (Date.now() - buyer.referredAt.getTime() <= twoYears) {
        const refUser = await this.prisma.user.findFirst({
          where: {
            id: buyer.referredById,
            coach: { isNot: null },
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        // معرفی‌کننده نباید خود همان مربی فروشنده باشد (اختیاری)
        if (refUser && refUser.id !== req.coach.userId) {
          referralUserId = refUser.id;
          referralAmount = totalPayable.mul(5).div(100);
        }
      }
    }

    let coachNet = totalPayable.sub(commissionAmount).sub(referralAmount);
    if (coachNet.lt(0)) coachNet = this.d(0);

    const discountAmount = original.sub(payable);
    if (discountAmount.lt(0)) {
      /* payable > original فقط در حالت عجیب */
    }

    return {
      planRequestId: req.id,
      coachId: req.coachId,
      lines,
      originalAmount: original,
      discountAmount: Prisma.Decimal.max(discountAmount, this.d(0)),
      taxAmount,
      commissionRate,
      commissionAmount,
      referralAmount,
      referralUserId,
      payableAmount: totalPayable,
      coachNetAmount: coachNet,
      discountCodeId: codeId,
      discountBreakdown,
      snapshot: {
        lines,
        discountBreakdown,
        commissionRate: commissionRate.toFixed(2),
        referralUserId,
        currency: 'IRR',
      },
    };
  }

  private async applyDiscountCode(args: {
    code: string;
    scopeHint: string[];
    coachId?: string;
    amount: Prisma.Decimal;
    userId: string;
  }) {
    const code = await this.prisma.discountCode.findFirst({
      where: {
        code: args.code,
        // isActive / date fields مطابق مدل خودت
      },
    });
    if (!code) throw new BadRequestException('کد تخفیف معتبر نیست');

    // وضعیت/اسکوپ: StatusDiscount روی مدل — نام فیلد را با schema خودت یکی کن
    // if (!args.scopeHint.includes(code.statusDiscount)) throw ...

    let off = this.d(0);
    if (code.type === 'PERCENTAGE') {
      off = args.amount.mul(code.value).div(100);
      if (code.maxDiscount && off.gt(code.maxDiscount)) off = this.d(code.maxDiscount);
    } else {
      off = this.d(code.value);
    }
    if (off.gt(args.amount)) off = args.amount;

    return {
      payable: args.amount.sub(off),
      discountCodeId: code.id,
      breakdown: [
        { source: 'CODE', code: args.code, amount: off.toFixed(2) },
      ],
    };
  }

  /**
   * ساخت ServiceOrder + Payment PENDING
   * فرانت/درگاه بعداً complete را صدا می‌زند
   */
  async initiatePlanPayment(
    userId: string,
    dto: {
      planRequestId: string;
      method: 'WALLET' | 'ZARINPAL' | 'CARD';
      discountCode?: string;
    },
  ) {
    const quote = await this.quotePlanRequest(
      userId,
      dto.planRequestId,
      dto.discountCode,
    );

    return this.prisma.$transaction(async (tx) => {
      await this.ensureWallet(userId, tx);

      const order = await tx.serviceOrder.create({
        data: {
          type: 'PLAN',
          status: 'PENDING_PAYMENT',
          userId,
          coachId: quote.coachId,
          planRequestId: quote.planRequestId,
          originalAmount: quote.originalAmount,
          discountAmount: quote.discountAmount,
          taxAmount: quote.taxAmount,
          commissionAmount: quote.commissionAmount,
          referralAmount: quote.referralAmount,
          payableAmount: quote.payableAmount,
          coachNetAmount: quote.coachNetAmount,
          discountCodeId: quote.discountCodeId,
          snapshot: quote.snapshot as any,
        },
      });

      const payment = await tx.payment.create({
        data: {
          amount: quote.payableAmount,
          method: dto.method,
          status: 'PENDING',
          serviceOrderId: order.id,
          planRequestId: quote.planRequestId,
        },
      });

      // پرداخت از کیف پول → همان‌جا complete داخلی
      if (dto.method === 'WALLET') {
        await this.completePlanPaymentTx(tx, {
          paymentId: payment.id,
          gatewayRef: `wallet-${payment.id}`,
        });
        return { orderId: order.id, paymentId: payment.id, status: 'PAID' };
      }

      // درگاه: تو authority را می‌سازی و برمی‌گردانی
      return {
        orderId: order.id,
        paymentId: payment.id,
        amount: quote.payableAmount,
        status: 'PENDING_PAYMENT',
      };
    });
  }

  /**
   * از وب‌هوک / callback درگاه صدا بزن
   */
  async completePlanPayment(paymentId: string, gatewayRef: string) {
    return this.prisma.$transaction(async (tx) =>
      this.completePlanPaymentTx(tx, { paymentId, gatewayRef }),
    );
  }

  private async completePlanPaymentTx(
    tx: Prisma.TransactionClient,
    args: { paymentId: string; gatewayRef: string },
  ) {
    const payment = await tx.payment.findUnique({
      where: { id: args.paymentId },
      include: {
        serviceOrder: true,
      },
    });
    if (!payment?.serviceOrder) throw new NotFoundException('پرداخت یافت نشد');
    if (payment.status === 'PAID') {
      return { success: true, idempotent: true };
    }
    if (payment.serviceOrder.status === 'PAID') {
      return { success: true, idempotent: true };
    }

    const order = payment.serviceOrder;
    if (order.type !== 'PLAN') {
      throw new BadRequestException('این متد فقط برای برنامه مربی است');
    }

    const userWallet = await this.ensureWallet(order.userId, tx);
    const amount = this.d(payment.amount);

    // ---- روش WALLET: کسر از موجودی ----
    if (payment.method === 'WALLET') {
      const updated = await tx.wallet.updateMany({
        where: {
          id: userWallet.id,
          balance: { gte: amount },
        },
        data: { balance: { decrement: amount } },
      });
      if (updated.count === 0) {
        throw new BadRequestException('موجودی کیف پول کافی نیست');
      }
      await tx.walletTransaction.create({
        data: {
          type: 'PURCHASE',
          status: 'COMPLETED',
          amount,
          trackingCode: this.tracking('PUR'),
          userId: order.userId,
          walletId: userWallet.id,
          // orderId فروشگاهی نگذار؛ در description/snapshot نگه دار
        },
      });
    } else {
      // درگاه: شارژ مجازی + خرید (ردپای حسابداری)
      await tx.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { increment: amount } },
      });
      await tx.walletTransaction.create({
        data: {
          type: 'DEPOSIT',
          status: 'COMPLETED',
          amount,
          trackingCode: this.tracking('DEP'),
          userId: order.userId,
          walletId: userWallet.id,
        },
      });
      await tx.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { decrement: amount } },
      });
      await tx.walletTransaction.create({
        data: {
          type: 'PURCHASE',
          status: 'COMPLETED',
          amount,
          trackingCode: this.tracking('PUR'),
          userId: order.userId,
          walletId: userWallet.id,
        },
      });
    }

    // ---- سهم مربی (آنی، بدون pending) ----
    if (order.coachId && this.d(order.coachNetAmount).gt(0)) {
      const coach = await tx.coach.findUnique({
        where: { id: order.coachId },
        select: { userId: true },
      });
      if (!coach) throw new NotFoundException('مربی یافت نشد');

      const coachWallet = await this.ensureWallet(coach.userId, tx);
      await tx.wallet.update({
        where: { id: coachWallet.id },
        data: { balance: { increment: order.coachNetAmount } },
      });
      await tx.walletTransaction.create({
        data: {
          type: 'COACH_SETTLEMENT',
          status: 'COMPLETED',
          amount: order.coachNetAmount,
          trackingCode: this.tracking('CST'),
          userId: coach.userId,
          walletId: coachWallet.id,
        },
      });
    }

    // ---- کمیسیون پلتفرم (ولت پلتفرم اگر داری) ----
    // TODO: platform wallet id از config

    // ---- پاداش معرفی ----
    const snap = order.snapshot as any;
    const referralUserId = snap?.referralUserId as string | null;
    if (referralUserId && this.d(order.referralAmount).gt(0)) {
      const refWallet = await this.ensureWallet(referralUserId, tx);
      await tx.wallet.update({
        where: { id: refWallet.id },
        data: { balance: { increment: order.referralAmount } },
      });
      await tx.walletTransaction.create({
        data: {
          type: 'REFERRAL_BONUS',
          status: 'COMPLETED',
          amount: order.referralAmount,
          trackingCode: this.tracking('REF'),
          userId: referralUserId,
          walletId: refWallet.id,
        },
      });
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        gatewayRef: args.gatewayRef,
        paidAt: new Date(),
      },
    });

    await tx.serviceOrder.update({
      where: { id: order.id },
      data: { status: 'PAID', paidAt: new Date() },
    });

    await tx.planRequest.update({
      where: { id: order.planRequestId! },
      data: { status: 'PAID' },
    });

    // usage کد تخفیف
    if (order.discountCodeId) {
      await tx.discountCodeUsage.create({
        data: {
          discountCodeId: order.discountCodeId,
          userId: order.userId,
          amount: order.discountAmount,
        },
      });
    }

    return { success: true, orderId: order.id };
  }

  /**
   * استرداد — برگشت به کیف پول کاربر + برگشت از مربی/معرف در حد امکان
   */
  async refundPlanPayment(
    paymentId: string,
    dto: { amount?: number; reason?: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { serviceOrder: true },
      });
      if (!payment?.serviceOrder || payment.status !== 'PAID') {
        throw new BadRequestException('پرداخت قابل استرداد نیست');
      }
      const order = payment.serviceOrder;
      const refundAmount = dto.amount
        ? this.d(dto.amount)
        : this.d(order.payableAmount);

      if (refundAmount.gt(order.payableAmount)) {
        throw new BadRequestException('مبلغ استرداد بیشتر از پرداخت است');
      }

      const userWallet = await this.ensureWallet(order.userId, tx);
      await tx.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { increment: refundAmount } },
      });
      await tx.walletTransaction.create({
        data: {
          type: 'REFUND',
          status: 'COMPLETED',
          amount: refundAmount,
          trackingCode: this.tracking('RFD'),
          userId: order.userId,
          walletId: userWallet.id,
        },
      });

      // برگشت سهم مربی به‌صورت نسبتی ساده
      const ratio = refundAmount.div(order.payableAmount);
      const coachCut = this.d(order.coachNetAmount).mul(ratio);
      if (order.coachId && coachCut.gt(0)) {
        const coach = await tx.coach.findUnique({
          where: { id: order.coachId },
          select: { userId: true },
        });
        if (coach) {
          const cw = await this.ensureWallet(coach.userId, tx);
          await tx.wallet.updateMany({
            where: { id: cw.id, balance: { gte: coachCut } },
            data: { balance: { decrement: coachCut } },
          });
          // اگر موجودی مربی کم بود: فقط log — یا balance را منفی نکن؛ سیاست خودت
          await tx.walletTransaction.create({
            data: {
              type: 'RETURN_DEDUCTION',
              status: 'COMPLETED',
              amount: coachCut,
              trackingCode: this.tracking('RDC'),
              userId: coach.userId,
              walletId: cw.id,
            },
          });
        }
      }

      const full = refundAmount.eq(order.payableAmount);
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: full ? 'REFUNDED' : 'PAID' },
      });
      await tx.serviceOrder.update({
        where: { id: order.id },
        data: {
          status: full ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
          refundedAt: new Date(),
        },
      });

      return { success: true };
    });
  }

  // ─── Subscription (ساده‌تر) ───

  async initiateSubscriptionPayment(
    userId: string,
    dto: {
      subscriptionPlanId: string;
      method: 'WALLET' | 'ZARINPAL' | 'CARD';
      discountCode?: string;
    },
  ) {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: { id: dto.subscriptionPlanId /* isActive: true */ },
    });
    if (!plan) throw new NotFoundException('پلن یافت نشد');

    let original = this.d(plan.price);
    let payable = original;
    let discountAmount = this.d(0);
    let codeId: string | null = null;

    if (dto.discountCode) {
      const applied = await this.applyDiscountCode({
        code: dto.discountCode,
        scopeHint: ['PLATFORM', 'PLAN'],
        amount: payable,
        userId,
      });
      discountAmount = payable.sub(applied.payable);
      payable = applied.payable;
      codeId = applied.discountCodeId;
    }

    return this.prisma.$transaction(async (tx) => {
      await this.ensureWallet(userId, tx);

      const subscription = await tx.subscription.create({
        data: {
          pricePaid:payable,
          userId,
          planId: plan.id,
          status:'PENDING'
          // status: PENDING یا فیلدهای خودت
        },
      });

      const order = await tx.serviceOrder.create({
        data: {
          type: 'SUBSCRIPTION',
          status: 'PENDING_PAYMENT',
          userId,
          subscriptionId: subscription.id,
          originalAmount: original,
          discountAmount,
          taxAmount: 0,
          commissionAmount: 0,
          referralAmount: 0,
          payableAmount: payable,
          coachNetAmount: 0,
          discountCodeId: codeId,
          snapshot: {
            planId: plan.id,
            planTitle: plan.title,
          } as any,
        },
      });

      const payment = await tx.payment.create({
        data: {
          amount: payable,
          method: dto.method,
          status: 'PENDING',
          serviceOrderId: order.id,
          subscriptionId: subscription.id,
        },
      });

      if (dto.method === 'WALLET') {
        await this.completeSubscriptionPaymentTx(tx, payment.id, `wallet-${payment.id}`);
        return { orderId: order.id, paymentId: payment.id, status: 'PAID' };
      }

      return {
        orderId: order.id,
        paymentId: payment.id,
        amount: payable,
        status: 'PENDING_PAYMENT',
      };
    });
  }

  async completeSubscriptionPayment(paymentId: string, gatewayRef: string) {
    return this.prisma.$transaction((tx) =>
      this.completeSubscriptionPaymentTx(tx, paymentId, gatewayRef),
    );
  }

  private async completeSubscriptionPaymentTx(
    tx: Prisma.TransactionClient,
    paymentId: string,
    gatewayRef: string,
  ) {
    const payment = await tx.payment.findUnique({
      where: { id: paymentId },
      include: { serviceOrder: true },
    });
    if (!payment?.serviceOrder) throw new NotFoundException();
    if (payment.status === 'PAID') return { success: true, idempotent: true };

    const order = payment.serviceOrder;
    const userWallet = await this.ensureWallet(order.userId, tx);
    const amount = this.d(payment.amount);

    if (payment.method === 'WALLET') {
      const ok = await tx.wallet.updateMany({
        where: { id: userWallet.id, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (ok.count === 0) throw new BadRequestException('موجودی کافی نیست');
    } else {
      await tx.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { increment: amount } },
      });
      await tx.walletTransaction.create({
        data: {
          type: 'DEPOSIT',
          status: 'COMPLETED',
          amount,
          trackingCode: this.tracking('DEP'),
          userId: order.userId,
          walletId: userWallet.id,
        },
      });
      await tx.wallet.update({
        where: { id: userWallet.id },
        data: { balance: { decrement: amount } },
      });
    }

    await tx.walletTransaction.create({
      data: {
        type: 'PURCHASE',
        status: 'COMPLETED',
        amount,
        trackingCode: this.tracking('PUR'),
        userId: order.userId,
        walletId: userWallet.id,
      },
    });

    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'PAID', gatewayRef, paidAt: new Date() },
    });
    await tx.serviceOrder.update({
      where: { id: order.id },
      data: { status: 'PAID', paidAt: new Date() },
    });
    // subscription status ACTIVE + periodEnd را با مدل خودت ست کن

    return { success: true };
  }
}