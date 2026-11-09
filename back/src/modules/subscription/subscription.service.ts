import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import {
  CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto,
  SubscribePlanDto, UpdateSubscriptionStatusDto,
} from './dto/subscription.dto.js';
import { SubscriptionPlanType, SubscriptionStatus } from '../../generated/prisma/enums.js';

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  private getLimit(limit?: any) {
    return Math.max(1, Number(limit) || Number(this.configService.get('limit.subscription')) || 10);
  }

  // ============ Plan: Public ============

  async getPlans(type: SubscriptionPlanType) {
    const where = {
      ...(type && { type }),
      isActive: true
    }
    return this.prisma.subscriptionPlan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
    });
  }

  // ============ Plan: Admin ============

  async getAllPlansAdmin(query: QueryDefaultDto, type: SubscriptionPlanType) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = {
      ...(type && { type })
    }
    const [data, count] = await Promise.all([
      this.prisma.subscriptionPlan.findMany({
        where,
        skip, take: limitPage,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.subscriptionPlan.count({ where }),
    ]);
    return { plans: data, pagination: pagination(count, page, limitPage) };
  }

  async createPlan(dto: CreateSubscriptionPlanDto) {
    const exists = await this.prisma.subscriptionPlan.findUnique({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('این slug قبلاً ثبت شده');
    await this.prisma.subscriptionPlan.create({
      data: dto,
    });
    return { success: true }
  }

  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('پلن یافت نشد');

    if (dto.slug && dto.slug !== plan.slug) {
      const exists = await this.prisma.subscriptionPlan.findUnique({ where: { slug: dto.slug } });
      if (exists) throw new ConflictException('این slug قبلاً ثبت شده');
    }
    await this.prisma.subscriptionPlan.update({ where: { id }, data: dto });

    return { success: true }
  }

  async deletePlan(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('پلن یافت نشد');

    const active = await this.prisma.subscription.count({
      where: { planId: id, status: 'ACTIVE' },
    });
    if (active > 0) throw new BadRequestException('پلن دارای اشتراک فعال است — ابتدا غیرفعال کنید');

    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return { success: true };
  }

  // ============ Subscription: User ============

  async subscribe(userId: string, dto: SubscribePlanDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isUsedTrial: true } });
    if (!user) throw new NotFoundException('کاربر یافت نشد');
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan || !plan.isActive) throw new NotFoundException('پلن یافت نشد یا غیرفعال است');
    const active = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] }, endsAt: { gt: new Date() } },
    });
    if (active) throw new ConflictException('شما یک اشتراک فعال دارید — ابتدا آن را لغو کنید');
    const now = new Date();
    const isEligibleForTrial = !user.isUsedTrial && plan.trialDays > 0;
    let trialEnds = null;
    if (isEligibleForTrial) {
      trialEnds = new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);
    }
    if (isEligibleForTrial) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { isUsedTrial: true },
      });
      await this.prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: 'TRIALING',
          pricePaid: plan.price,
          trialEndsAt: trialEnds,
        }
      });
    } else {
      await this.prisma.subscription.create({
        data: {
          userId,
          planId: plan.id,
          status: 'PENDING',
          pricePaid: plan.price,
        },
      });
    }
    return {
      trialEndsAt: trialEnds,
      paymentRequired: !isEligibleForTrial,
      message: isEligibleForTrial
        ? `اشتراک آزمایشی ${plan.trialDays} روزه فعال شد`
        : 'برای فعال‌سازی، پرداخت را تکمیل کنید',
    };
  }

  async getMySubscriptionDetail(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    if (!sub) return null;
    return sub;
  }

  async getMySubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'TRIALING'] } },
      select: {
        id: true,
        userId: true,
        planId: true,
        startsAt: true,
        endsAt: true,
        trialEndsAt: true,
        status: true,
        plan: {
          select: {
            type: true,
            durationDays: true,
            trialDays: true,
            aiChatLimitPerDay: true,
            aiPlanLimitPerMonth: true,
            canRequestCoach: true,
            canTrackProgress: true,
            isActive: true,
          }
        }
      }
    });
    if (!sub) return null;
    return sub;
  }

  async getMySubscriptions(userId: string, query: QueryDefaultDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;

    const where = { userId };
    const [data, count] = await Promise.all([
      this.prisma.subscription.findMany({
        where, skip, take: limitPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          planId: true,
          status: true,
          pricePaid: true,
          trialEndsAt: true,
          startsAt: true,
          endsAt: true,
          plan: {
            select: {
              title: true,
              id: true,
              slug: true,
              coverImg: true,
              durationDays: true,
              trialDays: true,
            }
          }
        }
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return { subscriptions: data, pagination: pagination(count, page, limitPage) };
  }

  async cancelMySubscription(userId: string, id: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id, userId, status: { in: ['ACTIVE', 'TRIALING'] } },
    });
    if (!sub) throw new NotFoundException('اشتراک فعال یافت نشد');

    await this.prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
    return { success: true }
  }

  // ============ Subscription: Admin ============

  async getAllSubscriptionsAdmin(query: QueryDefaultDto, status: SubscriptionStatus) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = {
      ...(status && { status }),
    }
    const [data, count] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip, take: limitPage,
        include: {
          plan: { select: { id: true, title: true, slug: true } },
          user: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return { subscriptions: data, pagination: pagination(count, page, limitPage) };
  }

  async updateSubscriptionStatus(id: string, dto: UpdateSubscriptionStatusDto) {
    const sub = await this.prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('اشتراک یافت نشد');

    const data: any = { status: dto.status };
    if (dto.status === 'ACTIVE' && !sub.startsAt) data.startsAt = new Date();
    if (dto.status === 'CANCELLED') data.cancelledAt = new Date();

    await this.prisma.subscription.update({ where: { id }, data });
    return { success: true }
  }
}