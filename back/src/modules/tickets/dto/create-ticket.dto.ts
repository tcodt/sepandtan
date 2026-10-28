/**
 * CreateTicketDto - دتایا برای ایجاد تیکت جدید
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength, IsEnum, IsNumber, IsBoolean } from 'class-validator';
import { TicketPriority, TicketStatus } from '../../../generated/prisma/enums.js';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';

export class CreateTicketDto {
  @ApiProperty({ description: 'عنوان تیکت', example: 'آدرس اشتباه' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'پیوست به سفارش (اختیاری)', example: 'bb9fc4f4-b7d8-465b-831d-10b27fe5e6f1' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'اولویت تیکت', example: TicketPriority.MEDIUM, enum: TicketPriority })
  @IsEnum(TicketPriority)
  @IsString()
  priority: TicketPriority = 'MEDIUM';


  @ApiProperty({ description: 'محتوای پیام', example: 'آدرس وارد شده توی تسویه حساب مشکل داره و اشتباه هستش ممکنه برام تغییرش بدین ؟' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @ApiProperty({ description: 'لیست آدرس تصاویر (اختیاری)', type: [String], required: false, example: ['marketino/image/2026/10/screenshot-2026-06-08-161115-253371-5946.png'] })
  @IsOptional()
  images?: string[]; // Array of image URLs
}

export class UpdateTicketDto {
  @ApiProperty({ description: 'وضعیت جدید تیکت', enum: TicketStatus, example: TicketStatus.RESOLVED })
  @IsEnum(TicketStatus)
  @IsOptional()
  status?: TicketStatus;

  @ApiProperty({ description: 'اولویت جدید تیکت', enum: TicketPriority, example: TicketPriority.MEDIUM })
  @IsEnum(TicketPriority)
  @IsOptional()
  priority?: TicketPriority;

  @ApiProperty({ description: 'خوانده شدن تیکت توسط کاربر', example: false })
  @IsBoolean()
  @IsOptional()
  isUserRead?: boolean;
}

export class QueryTicketsDto extends QueryDefaultDto {
  @ApiProperty({ description: 'جستجو در کد پیگیری تیکت', required: false })
  @IsOptional()
  search?: string;

  @ApiProperty({ description: 'فیلتر بر اساس وضعیت', enum: ['ALL', ...Object.values(TicketStatus)] })
  @IsOptional()
  status?: TicketStatus | "ALL";

  @ApiProperty({ description: 'فیلتر بر اساس اولویت', enum: ['ALL', ...Object.values(TicketPriority)] })
  @IsOptional()
  priority?: TicketPriority | "ALL";
}