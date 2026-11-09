import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AccessTokenGuard } from "../auth/guard/access-token.guard.js";
import { ServiceOrderService } from "./service-order.service.js";
import { CurrentUser } from "../../common/decorators/current-user.decorator.js";
import { Roles } from "../auth/decorators/roles.decorator.js";

@ApiTags('ServiceOrder')
@Controller('service-order')
@UseGuards(AccessTokenGuard)
export class ServiceOrderController {
  constructor(private readonly service: ServiceOrderService) { }

  @Post('plan/quote')
  quotePlan(
    @CurrentUser('id') userId: string,
    @Body() body: { planRequestId: string; discountCode?: string },
  ) {
    return this.service.quotePlanRequest(
      userId,
      body.planRequestId,
      body.discountCode,
    );
  }

  @Post('plan/pay')
  payPlan(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      planRequestId: string;
      method: 'WALLET' | 'ZARINPAL' | 'CARD';
      discountCode?: string;
    },
  ) {
    return this.service.initiatePlanPayment(userId, body);
  }

  /** بعد از verify درگاه — می‌تواند داخلی/ادمین باشد */
  @Post('plan/complete')
  completePlan(@Body() body: { paymentId: string; gatewayRef: string }) {
    return this.service.completePlanPayment(body.paymentId, body.gatewayRef);
  }

  @Post('plan/refund')
  @Roles('ADMIN', 'SUPERADMIN')
  refundPlan(
    @Body() body: { paymentId: string; amount?: number; reason?: string },
  ) {
    return this.service.refundPlanPayment(body.paymentId, body);
  }

  @Post('subscription/pay')
  paySub(
    @CurrentUser('id') userId: string,
    @Body()
    body: {
      subscriptionPlanId: string;
      method: 'WALLET' | 'ZARINPAL' | 'CARD';
      discountCode?: string;
    },
  ) {
    return this.service.initiateSubscriptionPayment(userId, body);
  }

  @Post('subscription/complete')
  completeSub(@Body() body: { paymentId: string; gatewayRef: string }) {
    return this.service.completeSubscriptionPayment(
      body.paymentId,
      body.gatewayRef,
    );
  }
}