import { IsString, IsOptional, IsNumber, Min, IsArray, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAttributeValueDto {
  @ApiProperty({ description: 'شناسه ویژگی', example: '6864a6cb-f493-49ba-9481-07dc34448e50' })
  @IsString()
  attributeId!: string;

  @ApiProperty({ description: 'مقدار ویژگی', example: 'XL' })
  @IsString()
  value!: string;
}

export class CreateProductVariantDto {
  @ApiProperty({ description: 'نام تنوع', example: 'Samsung Galaxy S24 - Black' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: 'قیمت (تومان)', example: 35000000, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiProperty({ description: 'تعداد موجودی', example: 15, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({ description: 'شناسه رنگ', example: '6864a6cb-f493-49ba-9481-07dc34448e50' })
  @IsOptional()
  @IsString()
  colorId?: string;

  @ApiPropertyOptional({ description: 'آدرس تصویر', example: 'marketino/image/2026/10/screenshot-2026-06-08-161115-253371-5946.png' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'شناسه تخفیف', example: '6864a6cb-f493-49ba-9481-07dc34448e50' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value === '' ? null : value)
  discountId?: string;

  @ApiProperty({ description: 'شناسه محصول', example: '6864a6cb-f493-49ba-9481-07dc34448e50' })
  @IsString()
  productId!: string;

  @ApiPropertyOptional({
    description: 'ویژگی‌های تنوع',
    type: [CreateAttributeValueDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttributeValueDto)
  attributes?: CreateAttributeValueDto[];
}

import { PartialType, OmitType } from '@nestjs/swagger';

export class UpdateProductVariantDto extends PartialType(
  OmitType(CreateProductVariantDto, ['productId'] as const),
) { }