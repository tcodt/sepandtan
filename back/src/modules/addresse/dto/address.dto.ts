/**
 * Address DTOs - اشیاء انتقال داده آدرس‌ها
 */
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateAddressDto {
  @ApiPropertyOptional({ description: 'عنوان آدرس (مثلاً: خانه، محل کار)', example: 'خونه' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ description: 'نام و نام خانوادگی گیرنده', example: 'علی آقا' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ description: 'شماره تلفن', example: '091212345678' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ description: 'استان', example: 'aa302071-a01e-4933-a47e-3db4f56b6660' })
  @IsString()
  @IsNotEmpty()
  provinceId!: string;

  @ApiProperty({ description: 'شهر', example: 'aa302071-a01e-4933-a47e-3db4f56b6660' })
  @IsString()
  @IsNotEmpty()
  cityId!: string;

  @ApiProperty({ description: 'آدرس کامل', example: 'خیابان آزادی ، کوچه میهن ، پلاک 12' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiPropertyOptional({ description: 'کد پستی', example: '1981645344' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'آدرس پیش‌فرض', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateAddressDto {
  @ApiPropertyOptional({ description: 'عنوان آدرس', example: 'خونه' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'نام و نام خانوادگی گیرنده', example: 'علی آقا' })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ description: 'شماره تلفن', example: '091212345678' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'استان', example: '76cd6cc4-2175-4598-9aa9-ad991a4e321a' })
  @IsOptional()
  @IsString()
  provinceId?: string;

  @ApiPropertyOptional({ description: 'شهر', example: '217b4ad1-92ec-4747-8240-520ce44384a6' })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({ description: 'آدرس کامل', example: 'خیابان آزادی ، کوچه میهن ، پلاک 12' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'کد پستی', example: '1981645344' })
  @IsOptional()
  @IsString()
  postalCode?: string;

  @ApiPropertyOptional({ description: 'آدرس پیش‌فرض', default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}