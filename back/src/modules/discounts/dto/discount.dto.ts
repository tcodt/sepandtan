/**
 * Discount DTOs
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, Min, Max, MaxLength, IsEnum, IsBoolean, IsArray, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType, StatusDiscount } from '../../../generated/prisma/enums.js';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';

export class CreateDiscountDto {
  @ApiProperty({ description: 'کد تخفیف', example: 'TEST' })
  @IsString()
  @MaxLength(50)
  code!: string;

  @IsOptional()
  @ApiProperty({ enum: DiscountType, description: 'کد تخفیف به صورت درصدی یا مبلغی', example: DiscountType.FIXED })
  @IsEnum(DiscountType, { message: 'نوع تخفیف نامعتبر است' })
  type!: DiscountType;

  @ApiProperty({ description: 'مقدار (درصد یا تومان)', example: 25000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value!: number;

  @ApiPropertyOptional({ description: 'حداقل مبلغ سفارش', default: 0, example: 100000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'حداکثر مبلغ تخفیف که از این بیشتر کاربر نتونه تخفیف بگیره', example: 20000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxDiscount?: number;

  @ApiPropertyOptional({ description: 'محدودیت تعداد استفاده (۰ = نامحدود)', example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  usageLimit?: number;

  @ApiProperty({ description: 'تاریخ شروع', example: '2025-10-27T15:22:00.506Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ description: 'تاریخ پایان', example: '2027-10-27T15:22:00.506Z' })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({ description: 'توضیحات', example: 'این تخفیف برای هالووین هستش و این توضیحات برای ادمین و فروشنده ' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'وضعیت تخفیف (فعال/غیرفعال)',
    example: true,
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsIn([...Object.values(StatusDiscount)])
  @ApiProperty({
    enum: [...Object.values(StatusDiscount)],
    required: true,
    description: 'نوع تخفیف',
  })
  status!: StatusDiscount;

  @ApiPropertyOptional({ description: 'آیدی فروشگاه ها فقط زمانی کاربرد داره که نوع تخفیف فروشنده باشه', example: ['8351bf0e-0cc9-4db3-8db3-677739fb4039'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  storeId?: string[];
}

export class SearchDiscountDto extends QueryDefaultDto {
  @IsOptional()
  @ApiProperty({ description: 'کد تخفیف', required: false })
  @IsString()
  code?: string;

  @IsOptional()
  @IsIn([...Object.values(DiscountType)])
  @ApiProperty({
    enum: [...Object.values(DiscountType)],
    required: false,
    description: 'وضعیت درصدی تخفیف',
  })
  type?: DiscountType;

  @ApiPropertyOptional({
    description: 'وضعیت تخفیف (فعال/غیرفعال)',
    type: Boolean,
  })
  @IsOptional()
  @IsBoolean()
  @Type()
  isActive?: boolean;

  @IsOptional()
  @IsIn([...Object.values(StatusDiscount), 'ALL'])
  @ApiProperty({
    enum: [...Object.values(StatusDiscount), 'ALL'],
    required: false,
    description: 'نوع تخفیف',
  })
  status?: StatusDiscount | 'ALL';

  @ApiPropertyOptional({ description: 'آیدی فروشنده ها' })
  @IsOptional()
  @IsString()
  userId?: string;
}
