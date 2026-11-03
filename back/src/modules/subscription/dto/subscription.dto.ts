import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsBoolean, IsInt, IsNumber,
  IsArray, MaxLength, Min, ArrayMaxSize, IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { SubscriptionStatus } from '../../../generated/prisma/enums.js';

// ---------- Plan (Admin) ----------
export class CreateSubscriptionPlanDto {
  @ApiProperty({ example: 'pro', description: 'شناسه یکتا (slug)' })
  @IsString() @MaxLength(50)
  slug!: string;

  @ApiProperty({ example: 'پلن حرفه‌ای' })
  @IsString() @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'دسترسی کامل' })
  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 299000 })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 399000 })
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  originalPrice?: number;

  @ApiProperty({ example: 30 })
  @Type(() => Number) @IsInt() @Min(1)
  durationDays!: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  trialDays?: number;

  @ApiPropertyOptional({ example: 10, description: 'null = نامحدود' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  aiPlanLimitPerMonth?: number;

  @ApiPropertyOptional({ example: 50, description: 'null = نامحدود' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  aiChatLimitPerDay?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  canRequestCoach?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  canTrackProgress?: boolean;

  @ApiProperty({ type: [String], example: ['مربی اختصاصی', 'AI نامحدود'] })
  @IsArray() @ArrayMaxSize(20) @IsString({ each: true })
  features!: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPopular?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  sortOrder?: number;
}

export class UpdateSubscriptionPlanDto extends PartialType(CreateSubscriptionPlanDto) {}

// ---------- Subscribe (User) ----------
export class SubscribePlanDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'آیدی پلن موردنظر' })
  @IsString()
  planId!: string;
}

// ---------- Admin: تغییر وضعیت ----------
export class UpdateSubscriptionStatusDto {
  @ApiProperty({
    enum: [...Object.values(SubscriptionStatus)],
    example: 'ACTIVE',
    description: 'PENDING/ACTIVE/EXPIRED/CANCELLED',
  })
  @IsEnum(SubscriptionStatus)
  status!: SubscriptionStatus;
}