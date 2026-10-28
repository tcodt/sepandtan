import { IsString, IsOptional, IsNumber, IsBoolean, Min, IsUUID, IsInt, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateShippingMethodDto {
  @ApiProperty({ example: 'ارسال با پست', description: 'مثلا : تیپاکس ، پست ملی ، چاپار' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: true, description: 'زمانی که میخواست این نوع روش ارسال فعال باشه' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true, description: 'فقط مجازه یه دونه از این روش بسازه' })
  @IsOptional()
  @IsBoolean()
  isFreeMethod?: boolean;
}

export class UpdateStoreShippingDto {
  @ApiProperty({ example: 'ارسال با پست' })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ description: 'فعال بودن', example: true })
  @IsOptional()
  @IsBoolean()
  isActive!: boolean;

  @ApiPropertyOptional({ description: 'شعار', example: 'سریع و پیشتاز' })
  @IsOptional()
  @IsString()
  phrase?: string;

  @ApiPropertyOptional({ description: 'حداقل ارسال', example: 0, required: true })
  @IsInt()
  minDays!: number;

  @ApiPropertyOptional({ description: 'حداکثر ارسال', example: 0, required: true })
  @IsInt()
  maxDays!: number;

  @ApiPropertyOptional({ description: 'این قیمت پیشفرض برای استان هاس', required: false })
  @IsOptional()
  @IsInt()
  defaultPrice?: number;
}

export class CreateStoreShippingDto extends UpdateStoreShippingDto {
  @ApiPropertyOptional({ description: 'آیدی حمل و نقل', example: '76cd6cc4-2175-4598-9aa9-ad991a4e321a' })
  @IsString()
  shippingMethodId!: string;
}

export class CreateStoreShippingRateDto {
  @ApiProperty({ description: 'هزینه ارسال به اون استان', example: 250000, required: true })
  @IsInt()
  price!: number;

  @ApiProperty({ example: 5, required: true })
  @IsInt()
  deliveryMaxDays!: number;

  @ApiPropertyOptional({ description: 'آیدی حمل و نقل', example: '76cd6cc4-2175-4598-9aa9-ad991a4e321a', required: true })
  @IsString()
  storeShippingMethodId!: string;

  @ApiPropertyOptional({ description: 'آیدی استان', example: '76cd6cc4-2175-4598-9aa9-ad991a4e321a', required: true })
  @IsString()
  provinceId!: string;
}