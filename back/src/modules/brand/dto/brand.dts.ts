/**
 * Category DTOs - اشیاء انتقال داده دسته‌بندی
 */
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, MaxLength, isBoolean, IsBoolean, IsInt } from 'class-validator';
export class BrandDto {
    @ApiProperty({
        description: 'نام فارسی برند',
        example: 'نایک',
    })
    @IsString()
    @MaxLength(200)
    name!: string;

    @ApiProperty({
        description: 'اسلاگ برند',
        example: 'nike',
    })
    @IsString()
    @MaxLength(200)
    slug!: string;

    @ApiPropertyOptional({
        description: 'لوگو',
        example: 'https://cdn.example.com/brands/nike-logo.png',
        nullable: true,
    })
    @IsOptional()
    @IsString()
    logo?: string;

    @ApiPropertyOptional({
        description: 'توضیحات برند',
        example: 'برند ورزشی آمریکایی معروف به تولید کفش و پوشاک',
        nullable: true,
    })
    @IsString()
    @IsOptional()
    @MaxLength(200)
    description?: string;

    @ApiPropertyOptional({
        description: 'ترتیب بر اساس',
        example: 1,
        minimum: 0,
    })
    @IsInt()
    @IsOptional()
    sortOrder?: number;
}

