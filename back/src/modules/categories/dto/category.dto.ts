/**
 * Category DTOs - اشیاء انتقال داده دسته‌بندی
 */
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, MaxLength, isBoolean, IsBoolean, MinLength } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'نام فارسی دسته‌بندی',
    example: 'پوشاک مردانه',
  })
  @IsString()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    description: 'اسلاگ به انگلیسی دسته‌بندی',
    example: 'pooshak_mardane',
  })
  @IsString()
  @MaxLength(200)
  slug!: string;

  @ApiPropertyOptional({
    description: 'شناسه والد (برای ساختار درختی) اجباری نیست میتونی نفرستی',
    example: 'cf91f6d4-ba85-4dd4-b870-37dbf1702ca4',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'نام آیکون',
    example: 'shirt',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'ترتیب نمایش',
    default: 0,
    example: 1,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({
    description: 'عنوان متا فارسی',
    example: 'خرید پوشاک مردانه | فروشگاه سپندتن',
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'توضیحات متا فارسی',
    example: 'بهترین پوشاک مردانه با کیفیت بالا و قیمت مناسب',
  })
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional({
    description: 'آدرس تصویر',
    example: 'https://cdn.example.com/categories/mens-clothing.png',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    description: 'وضعیت دسته',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class SearchCategoryPublic {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'در صورتی که میخواستی تمام دسته ها رو توی انتخابگر نمایش بدی حتی دسته های اصلی و مادر این گزینه رو غیر فعال کن',
    example: true
  })
  allCategory?: Boolean;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) { }
