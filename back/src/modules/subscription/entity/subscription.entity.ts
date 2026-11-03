import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscriptionPlanEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: 'pro', description: 'شناسه یکتای پلن' })
  slug!: string;

  @ApiProperty({ example: 'پلن حرفه‌ای' })
  title!: string;

  @ApiPropertyOptional({ example: 'دسترسی کامل به مربی و AI', nullable: true })
  description?: string | null;

  @ApiProperty({ example: 299000, description: 'قیمت فعلی (ریال)' })
  price!: number;

  @ApiPropertyOptional({ example: 399000, nullable: true, description: 'قیمت خط‌خورده برای نمایش تخفیف' })
  originalPrice?: number | null;

  @ApiProperty({ example: 30, description: 'مدت (روز)' })
  durationDays!: number;

  @ApiProperty({ example: 7, description: 'روزهای آزمایشی رایگان' })
  trialDays!: number;

  @ApiPropertyOptional({ example: 10, nullable: true, description: 'محدودیت پلن AI در ماه (null = نامحدود)' })
  aiPlanLimitPerMonth?: number | null;

  @ApiPropertyOptional({ example: 50, nullable: true, description: 'محدودیت چت AI روزانه (null = نامحدود)' })
  aiChatLimitPerDay?: number | null;

  @ApiProperty({ example: true, description: 'امکان درخواست مربی' })
  canRequestCoach!: boolean;

  @ApiProperty({ example: true, description: 'امکان پیگیری پیشرفت' })
  canTrackProgress!: boolean;

  @ApiProperty({ type: [String], example: ['مربی اختصاصی', 'پلن AI نامحدود'] })
  features!: string[];

  @ApiProperty({ example: true, description: 'نشان «محبوب‌ترین»' })
  isPopular!: boolean;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiProperty({ example: 1 })
  sortOrder!: number;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}

export class SubscriptionEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  userId!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  planId!: string;

  @ApiProperty({
    enum: ['PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED'],
    example: 'ACTIVE',
    description: 'PENDING=منتظر پرداخت، ACTIVE=فعال، EXPIRED=منقضی، CANCELLED=لغو شده',
  })
  status!: string;

  @ApiProperty({ example: 299000, description: 'قیمت پرداخت‌شده (snapshot لحظه خرید)' })
  pricePaid!: number;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z', nullable: true })
  startsAt?: Date | null;

  @ApiPropertyOptional({ example: '2025-02-01T00:00:00.000Z', nullable: true })
  endsAt?: Date | null;

  @ApiPropertyOptional({ example: null, nullable: true })
  cancelledAt?: Date | null;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: SubscriptionPlanEntity })
  plan?: SubscriptionPlanEntity;
}