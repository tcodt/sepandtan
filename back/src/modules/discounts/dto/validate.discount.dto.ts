// discounts/dto/validate-discount.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  IsOptional,
  IsDate,
  IsBoolean,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// ===== محصولات داخلی =====

class ProductStoreDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  commissionRate!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  slug!: string;
}

class ProductImageDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  alt!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  url!: string;
}

class ProductDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  id!: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  storeId!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  slug!: string;

  @ApiProperty({ type: () => ProductStoreDto, required: false })
  @ValidateNested()
  @Type(() => ProductStoreDto)
  @IsOptional()
  store!: ProductStoreDto;

  @ApiProperty({ type: [ProductImageDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  @IsOptional()
  images!: ProductImageDto[];
}

// ===== رنگ =====

class ColorDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name!: string;
}

// ===== تخفیف =====

class DiscountInfoDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive!: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  value!: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  id!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  type!: string;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  endsAt!: Date;
}

// ===== واریانت =====

class VariantDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name!: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  id!: string;

  @ApiProperty({ type: () => ColorDto, nullable: true, required: false })
  @ValidateNested()
  @Type(() => ColorDto)
  @IsOptional()
  color!: ColorDto | null;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  price!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  sku!: string;

  @ApiProperty({ type: [String], required: false })
  @IsArray()
  @IsOptional()
  attributes!: any[];

  @ApiProperty({ type: () => DiscountInfoDto, nullable: true, required: false })
  @ValidateNested()
  @Type(() => DiscountInfoDto)
  @IsOptional()
  discount!: DiscountInfoDto | null;
}

// ===== آیتم سبد خرید =====

class CartItemDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  id!: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  quantity!: number;

  @ApiProperty({ required: false })
  @IsDate()
  @Type(() => Date)
  @IsOptional()
  createdAt!: Date;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  variantId!: string;

  @ApiProperty({ type: () => ProductDto, required: false })
  @ValidateNested()
  @Type(() => ProductDto)
  @IsOptional()
  product!: ProductDto;

  @ApiProperty({ type: () => VariantDto, required: false })
  @ValidateNested()
  @Type(() => VariantDto)
  @IsOptional()
  variant!: VariantDto;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalPrice!: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  totalDiscount!: number;
}

// ===== هر استور =====

class StoreDto {
  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  storeId!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  storeName!: string;


  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  storeSlug!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  commissionRate!: string;

  @ApiProperty({ type: [CartItemDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  @IsOptional()
  carts!: CartItemDto[];
}

// ===== DTO اصلی =====

export class ValidateDiscountDto {
  @ApiProperty({ example: 'summer', required: false })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ type: [StoreDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StoreDto)
  @IsOptional()
  stores!: StoreDto[];
}