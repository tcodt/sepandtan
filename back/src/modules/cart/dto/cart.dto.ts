/**
 * Cart DTOs - اشیاء انتقال داده سبد خرید
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class AddToCartDto {
  @ApiProperty({ description: 'شناسه محصول', example: '5be26d04-b98b-4c59-a969-0e2e4ec9442e' })
  @IsString()
  productId!: string;

  @ApiProperty({ description: 'شناسه ویژگی محصول', example: '5be26d04-b98b-4c59-a969-0e2e4ec9442e' })
  @IsString()
  variantId!: string;

  @ApiPropertyOptional({ description: 'تعداد', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  quantity?: number;
}

export class UpdateCartItemDto {
  @ApiProperty({ description: 'تعداد جدید', example: 3 })
  @Type(() => Number)
  @IsNumber()
  quantity!: number;
}
