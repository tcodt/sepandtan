import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateColorDto {
  @ApiProperty({ description: 'نام رنگ', example: 'آبی' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiProperty({ description: 'نام اسلاگ رنگ', example: 'blue' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug!: string;

  @ApiProperty({ description: 'کد هگز رنگ', example: '#1587eb' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  hexCode!: string;
}

export class UpdateColorDto {
  @ApiPropertyOptional({ description: 'نام رنگ' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiProperty({ description: 'نام اسلاگ رنگ' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  slug!: string;

  @ApiPropertyOptional({ description: 'کد هگز رنگ' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  hexCode?: string;
}