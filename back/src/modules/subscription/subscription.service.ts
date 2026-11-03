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

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getLimit(limit?: any) {
    return Math.max(1, Number(limit) || Number(this.configService.get('limit.coach')) || 10);
  }

  // ============ Plan: Public ============

  async getPlans(onlyActive = true) {
    return this.prisma.subscriptionPlan.findMany({
      where: onlyActive ? { isActive: true } : {},
      orderBy: [{ sortOrder: 'asc' }, { price: 'asc' }],
    });
  }

  async getPlanBySlug(slug: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { slug } });
    if (!plan) throw new NotFoundException('پلن یافت نشد');
    return plan;
  }

  async getPlanById(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('پلن یافت نشد');
    return plan;
  }

  // ============ Plan: Admin ============

  async getAllPlansAdmin(query: QueryDefaultDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;

    const [data, count] = await Promise.all([
      this.prisma.subscriptionPlan.findMany({
        skip, take: limitPage,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.subscriptionPlan.count(),
    ]);
    return { plans: data, pagination: pagination(count, page, limitPage) };
  }

  async createPlan(dto: CreateSubscriptionPlanDto) {
    const exists = await this.prisma.subscriptionPlan.findUnique({ where: { slug: dto.slug } });
    if (exists) throw new ConflictException('این slug قبلاً ثبت شده');

    return this.prisma.subscriptionPlan.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        description: dto.description,
        price: dto.price,
        originalPrice: dto.originalPrice,
        durationDays: dto.durationDays,
        trialDays: dto.trialDays ?? 0,
        aiPlanLimitPerMonth: dto.aiPlanLimitPerMonth,
        aiChatLimitPerDay: dto.aiChatLimitPerDay,
        canRequestCoach: dto.canRequestCoach ?? false,
        canTrackProgress: dto.canTrackProgress ?? true,
        features: dto.features,
        isPopular: dto.isPopular ?? false,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  async updatePlan(id: string, dto: UpdateSubscriptionPlanDto) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });
    if (!plan) throw new NotFoundException('پلن یافت نشد');

    if (dto.slug && dto.slug !== plan.slug) {
      const exists = await this.prisma.subscriptionPlan.findUnique({ where: { slug: dto.slug } });
      if (exists) throw new ConflictException('این slug قبلاً ثبت شده');
    }

    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
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
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: dto.planId },
    });
    if (!plan || !plan.isActive) throw new NotFoundException('پلن یافت نشد یا غیرفعال است');

    // چک اشتراک فعال قبلی
    const active = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE', endsAt: { gt: new Date() } },
    });
    if (active) throw new ConflictException('شما یک اشتراک فعال دارید — ابتدا آن را لغو کنید');

    const now = new Date();
    const trialEnds = plan.trialDays > 0
      ? new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000)
      : null;
    const endsAt = new Date(
      now.getTime() + (plan.trialDays + plan.durationDays) * 24 * 60 * 60 * 1000,
    );

    const sub = await this.prisma.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: plan.trialDays > 0 ? 'ACTIVE' : 'PENDING',
        pricePaid: plan.price,
        startsAt: now,
        endsAt,
      },
    });

    return {
      subscription: sub,
      trialEndsAt: trialEnds,
      paymentRequired: plan.trialDays === 0,
      message:
        plan.trialDays > 0
          ? `اشتراک آزمایشی ${plan.trialDays} روزه فعال شد`
          : 'برای فعال‌سازی، پرداخت را تکمیل کنید',
    };
  }

  async getMySubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { userId, status: 'ACTIVE' },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
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
        include: { plan: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return { subscriptions: data, pagination: pagination(count, page, limitPage) };
  }

  async cancelMySubscription(userId: string, id: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { id, userId, status: 'ACTIVE' },
    });
    if (!sub) throw new NotFoundException('اشتراک فعال یافت نشد');

    return this.prisma.subscription.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
    });
  }

  // ============ Subscription: Admin ============

  async getAllSubscriptionsAdmin(query: QueryDefaultDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;

    const [data, count] = await Promise.all([
      this.prisma.subscription.findMany({
        skip, take: limitPage,
        include: {
          plan: { select: { id: true, title: true, slug: true } },
          user: { select: { id: true, name: true, phone: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.count(),
    ]);
    return { subscriptions: data, pagination: pagination(count, page, limitPage) };
  }

  async updateSubscriptionStatus(id: string, dto: UpdateSubscriptionStatusDto) {
    const sub = await this.prisma.subscription.findUnique({ where: { id } });
    if (!sub) throw new NotFoundException('اشتراک یافت نشد');

    const data: any = { status: dto.status };
    if (dto.status === 'ACTIVE' && !sub.startsAt) data.startsAt = new Date();
    if (dto.status === 'CANCELLED') data.cancelledAt = new Date();

    return this.prisma.subscription.update({ where: { id }, data });
  }
}