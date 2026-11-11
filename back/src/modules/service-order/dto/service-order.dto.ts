import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNumberString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const METHODS = ['WALLET', 'ZARINPAL', 'CARD'] as const;
export type PayMethod = (typeof METHODS)[number];

export class QuotePlanDto {
  @ApiProperty({ description: 'آیدی درخواست برنامه (باید ACCEPTED باشد)' })
  @IsUUID()
  planRequestId!: string;

  @ApiPropertyOptional({ description: 'کد تخفیف (فقط یک کد)' })
  @IsOptional() @IsString() @MaxLength(50)
  discountCode?: string;
}

export class PayPlanDto extends QuotePlanDto {
  @ApiProperty({ enum: METHODS })
  @IsIn(METHODS)
  method!: PayMethod;
}

export class QuoteSubscriptionDto {
  @ApiProperty({ description: 'آیدی اشتراک کاربر (TRIALING یا PENDING) که قبلاً با subscribe ساخته شده' })
  @IsUUID()
  subscriptionId!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(50)
  discountCode?: string;
}

export class PaySubscriptionDto extends QuoteSubscriptionDto {
  @ApiProperty({ enum: METHODS })
  @IsIn(METHODS)
  method!: PayMethod;
}

/** فقط ادمین: تایید دستی (کارت‌به‌کارت) تا زمانی که callback درگاه نوشته شود */
export class ConfirmPaymentDto {
  @ApiProperty() @IsUUID() paymentId!: string;
  @ApiProperty({ description: 'شماره پیگیری / رسید' })
  @IsString() @MaxLength(100)
  gatewayRef!: string;
}

export class RefundDto {
  @ApiProperty() @IsUUID() paymentId!: string;

  @ApiPropertyOptional({ description: 'خالی = استرداد کامل (به‌صورت رشته برای دقت اعشار)' })
  @IsOptional() @IsNumberString()
  amount?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  reason?: string;
}