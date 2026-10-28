/**
 * CreateTicketMessageDto - دتایا برای ایجاد پیام تیکت
 */
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class CreateTicketMessageDto {
  @ApiProperty({ description: 'محتوای پیام' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  content!: string;

  @ApiProperty({ description: 'لیست آدرس تصاویر (اختیاری)', type: [String], required: false })
  @IsOptional()
  images?: string[]; // Array of image URLs
}

export class UpdateTicketMessageDto {}