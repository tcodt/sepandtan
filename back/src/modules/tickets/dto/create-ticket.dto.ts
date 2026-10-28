/**
 * CreateTicketDto - دتایا برای ایجاد تیکت جدید
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { TicketPriority, TicketStatus } from '../../../generated/prisma/enums.js';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';

export class CreateTicketDto {
  @ApiProperty({ description: 'عنوان تیکت' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'پیوست به سفارش (اختیاری)' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'اولویت تیکت', default: 'MEDIUM' })
  @IsEnum(TicketPriority)
  @IsString()
  priority: TicketPriority = 'MEDIUM';


  @ApiProperty({ description: 'محتوای پیام' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @ApiProperty({ description: 'لیست آدرس تصاویر (اختیاری)', type: [String], required: false })
  @IsOptional()
  images?: string[]; // Array of image URLs
}

export class UpdateTicketDto {
  @ApiProperty({ description: 'وضعیت جدید تیکت' })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @ApiProperty({ description: 'اولویت جدید تیکت' })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiProperty({ description: 'خوانده شدن تیکت توسط کاربر' })
  @IsBoolean()
  @IsOptional()
  isUserRead?: boolean;
}

export class QueryTicketsDto extends QueryDefaultDto {
  @ApiProperty({ description: 'جستجو در کد', required: false })
  @IsOptional()
  search?: string;

  @ApiProperty({ description: 'فیلتر بر اساس وضعیت', enum: ['ALL', ...Object.values(TicketStatus)] })
  @IsOptional()
  status?: TicketStatus | "ALL";

  @ApiProperty({ description: 'فیلتر بر اساس اولویت', enum: ['ALL', ...Object.values(TicketPriority)] })
  @IsOptional()
  priority?: TicketPriority | "ALL";
}