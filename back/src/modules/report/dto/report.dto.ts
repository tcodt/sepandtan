/**
 * Report DTOs - دتایا برای عملیات گزارش‌ها
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsEnum, IsNumber } from 'class-validator';
import { ReportsStatus } from '../../../generated/prisma/enums.js';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';

export class CreateReportDto {
  @ApiProperty({ description: 'نام فروشنده گزارش شده', required: false })
  @IsString()
  nameSeller?: string;

  @ApiProperty({ description: 'محتوای گزارش' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  @ApiProperty({ description: 'عنوان فروش', required: true })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  title!: string;

  @ApiProperty({ description: 'شماره فروش' })
  @IsString()
  orderCode?: string;

  @ApiProperty({ description: 'لیست آدرس تصاویر (اختیاری)', type: [String], required: false })
  @IsOptional()
  images?: string[]; // Array of image URLs
}

export class UpdateReportDto {
  @ApiProperty({ description: 'وضعیت گزارش', default: 'PENDING' })
  @IsEnum(ReportsStatus)
  @IsString()
  status: ReportsStatus = 'PENDING';
}

export class QueryReportsDto extends QueryDefaultDto {
  @ApiProperty({ description: 'فیلتر بر اساس وضعیت', enum: ['ALL', ...Object.values(ReportsStatus)] })
  @IsOptional()
  status?: ReportsStatus | "ALL";

  @ApiProperty({ description: 'شماره سفارش', required: false })
  @IsOptional()
  @IsString()
  search?: string
}