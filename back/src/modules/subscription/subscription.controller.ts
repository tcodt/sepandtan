import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param,
  UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { SubscriptionService } from './subscription.service.js';
import {
  CreateSubscriptionPlanDto, UpdateSubscriptionPlanDto,
  SubscribePlanDto, UpdateSubscriptionStatusDto,
} from './dto/subscription.dto.js';
import { SubscriptionPlanEntity, SubscriptionEntity } from './entity/subscription.entity.js';

@ApiTags('Subscription')
@Controller('subscription')
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  // ============ Public: Plans ============

  @Get('plan')
  @ApiOkResponse({ type: [SubscriptionPlanEntity] })
  @ApiOperation({ summary: 'لیست پلن‌های فعال (Public)', description: 'برای صفحه قیمت‌ها — مرتب بر اساس sortOrder و قیمت' })
  getPlans() {
    return this.subscriptionService.getPlans(true);
  }

  @Get('plan/slug/:slug')
  @ApiOkResponse({ type: SubscriptionPlanEntity })
  @ApiOperation({ summary: 'جزئیات پلن بر اساس slug (Public)' })
  getPlanBySlug(@Param('slug') slug: string) {
    return this.subscriptionService.getPlanBySlug(slug);
  }

  @Get('plan/:id')
  @ApiOkResponse({ type: SubscriptionPlanEntity })
  @ApiOperation({ summary: 'جزئیات پلن بر اساس آیدی (Public)' })
  getPlanById(@Param('id') id: string) {
    return this.subscriptionService.getPlanById(id);
  }

  // ============ User: Subscription ============

  @Get('my')
  @UseGuards(AccessTokenGuard)
  @ApiOkResponse({ type: SubscriptionEntity, description: 'null اگر اشتراک فعالی نباشد' })
  @ApiOperation({ summary: 'اشتراک فعال من (User)', description: 'برمی‌گرداند null اگر اشتراک فعالی نباشد' })
  getMySubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionService.getMySubscription(userId);
  }

  @Get('my/all')
  @UseGuards(AccessTokenGuard)
  @ApiOkResponse({ type: PaginatedResponse(SubscriptionEntity, 'subscriptions') })
  @ApiOperation({ summary: 'همه اشتراک‌های من (User)', description: 'با صفحه‌بندی، شامل همه وضعیت‌ها' })
  getMySubscriptions(@CurrentUser('id') userId: string, @Query() query: QueryDefaultDto) {
    return this.subscriptionService.getMySubscriptions(userId, query);
  }

  @Post('subscribe')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({
    summary: 'اشتراک جدید (User)',
    description: `
      - اگر پلن trialDays داشته باشد → وضعیت ACTIVE فوری
      - اگر trialDays = 0 → وضعیت PENDING و نیاز به پرداخت
      - اگر اشتراک فعال قبلی داشته باشید → خطای 409
      - خروجی: subscription + trialEndsAt + paymentRequired + message
    `,
  })
  subscribe(@CurrentUser('id') userId: string, @Body() dto: SubscribePlanDto) {
    return this.subscriptionService.subscribe(userId, dto);
  }

  @Patch('my/:id/cancel')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: 'لغو اشتراک من (User)' })
  cancelMySubscription(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.subscriptionService.cancelMySubscription(userId, id);
  }

  // ============ Admin: Plans ============

  @Get('admin/plan')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: PaginatedResponse(SubscriptionPlanEntity, 'plans') })
  @ApiOperation({ summary: 'همه پلن‌ها (Admin)', description: 'شامل غیرفعال‌ها' })
  getAllPlansAdmin(@Query() query: QueryDefaultDto) {
    return this.subscriptionService.getAllPlansAdmin(query);
  }

  @Post('admin/plan')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: SubscriptionPlanEntity })
  @ApiOperation({ summary: 'ایجاد پلن (Admin)' })
  createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionService.createPlan(dto);
  }

  @Put('admin/plan/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'ویرایش پلن (Admin)' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) {
    return this.subscriptionService.updatePlan(id, dto);
  }

  @Delete('admin/plan/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'حذف پلن (Admin)', description: 'اگر اشتراک فعال داشته باشد، خطا می‌دهد' })
  deletePlan(@Param('id') id: string) {
    return this.subscriptionService.deletePlan(id);
  }

  // ============ Admin: Subscriptions ============

  @Get('admin/subscription')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: PaginatedResponse(SubscriptionEntity, 'subscriptions') })
  @ApiOperation({ summary: 'همه اشتراک‌ها (Admin)', description: 'شامل اطلاعات پلن و کاربر' })
  getAllSubscriptionsAdmin(@Query() query: QueryDefaultDto) {
    return this.subscriptionService.getAllSubscriptionsAdmin(query);
  }

  @Patch('admin/subscription/:id/status')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'تغییر وضعیت اشتراک (Admin)', description: 'PENDING/ACTIVE/EXPIRED/CANCELLED' })
  updateSubscriptionStatus(@Param('id') id: string, @Body() dto: UpdateSubscriptionStatusDto) {
    return this.subscriptionService.updateSubscriptionStatus(id, dto);
  }
}