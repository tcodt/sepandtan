import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ServiceOrderService } from './service-order.service.js';
import {
  ConfirmPaymentDto, PayPlanDto, PaySubscriptionDto,
  QuotePlanDto, QuoteSubscriptionDto, RefundDto,
} from './dto/service-order.dto.js';

@ApiTags('ServiceOrder')
@Controller('service-order')
@UseGuards(AccessTokenGuard)
export class ServiceOrderController {
  constructor(private readonly service: ServiceOrderService) { }

  @Post('plan/quote')
  @ApiOperation({ summary: 'محاسبه قیمت برنامه مربی (User)', description: 'فقط اطلاعات مجاز برای مشتری برمی‌گردد (بدون کمیسیون/پاداش)' })
  quotePlan(@CurrentUser('id') userId: string, @Body() dto: QuotePlanDto) {
    return this.service.quotePlanRequest(userId, dto.planRequestId, dto.discountCode);
  }

  @Post('plan/pay')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'پرداخت برنامه مربی (User)', description: 'WALLET همان لحظه کامل می‌شود. درگاه/کارت: سفارش PENDING_PAYMENT ساخته یا با قیمت جدید آپدیت می‌شود' })
  payPlan(@CurrentUser('id') userId: string, @Body() dto: PayPlanDto) {
    return this.service.initiatePlanPayment(userId, dto);
  }

  @Post('subscription/quote')
  @ApiOperation({ summary: 'محاسبه قیمت اشتراک (User)' })
  quoteSub(@CurrentUser('id') userId: string, @Body() dto: QuoteSubscriptionDto) {
    return this.service.quoteSubscription(userId, dto.subscriptionId, dto.discountCode);
  }

  @Post('subscription/pay')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'پرداخت اشتراک (User)', description: 'بعد از پرداخت: status=ACTIVE، startsAt و endsAt ست می‌شود' })
  paySub(@CurrentUser('id') userId: string, @Body() dto: PaySubscriptionDto) {
    return this.service.initiateSubscriptionPayment(userId, dto);
  }

  /** موقت: تایید دستی تا وقتی callback درگاه با verify نوشته شود */
  @Post('payment/confirm')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'تایید پرداخت (Admin)', description: 'برای کارت‌به‌کارت یا تا زمان وصل شدن درگاه' })
  confirm(@Body() dto: ConfirmPaymentDto) {
    return this.service.completePayment(dto.paymentId, dto.gatewayRef);
  }

  @Post('refund')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'ثبت استرداد (Admin)', description: 'فقط ثبت REFUND؛ پول کارت‌به‌کارت دستی برگردانده می‌شود و هیچ ولتی تغییر نمی‌کند' })
  refund(@Body() dto: RefundDto) {
    return this.service.refundPayment(dto.paymentId, dto);
  }
}