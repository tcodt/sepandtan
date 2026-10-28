/**
 * CreateTicketMessageDto - دتایا برای ایجاد پیام تیکت
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateTicketMessageDto {
  @ApiProperty({ description: 'محتوای پیام', example: 'باشه چک میکنم بهتون اطلاعات میدم' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @ApiProperty({ description: 'لیست آدرس تصاویر (اختیاری)', type: [String], required: false, example: ['marketino/image/2026/10/screenshot-2026-06-08-161115-253371-5946.png'] })
  @IsOptional()
  images?: string[]; // Array of image URLs
}

export class UpdateTicketMessageDto { }