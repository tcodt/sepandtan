
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
export class CreateCountryDto {
  @ApiProperty({ description: 'نام کشور', example: 'ایران' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'اسلاگ کشور', example: 'iran' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug!: string;

  @ApiPropertyOptional({ description: 'آدرس پرچم کشور', example: 'https://example.com/iran-flag.png' })
  @IsString()
  @IsOptional()
  flag?: string;
}

export class UpdateCountryDto {
  @ApiPropertyOptional({ description: 'نام کشور' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'اسلاگ کشور' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  slug?: string;

  @ApiPropertyOptional({ description: 'آدرس پرچم کشور', example: 'https://example.com/iran-flag.png' })
  @IsString()
  @IsOptional()
  flag?: string;
}

export class CountrySearchDto {
  @ApiPropertyOptional({ 
    description: 'جستجو بر اساس نام یا اسلاگ کشور', 
    example: 'ایران' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'تعداد آیتم‌ها در هر صفحه', 
    example: 10,
    minimum: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ 
    description: 'شماره صفحه', 
    example: 1,
    minimum: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ 
    description: 'ترتیب مرتب‌سازی', 
    enum: ['asc', 'desc'],
    example: 'asc'
  })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';
}