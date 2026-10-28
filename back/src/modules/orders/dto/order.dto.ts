import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsString, IsOptional, IsIn, IsUUID, ValidateIf, IsNotEmpty, IsArray, ValidateNested, ArrayMinSize, IsNumber, IsEnum } from 'class-validator';
import { OrderStatus, PaymentMethod, PaymentStatus, StatusDiscount } from '../../../generated/prisma/enums.js';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';

export class CheckoutItemDto {
  @ApiProperty({
    description: 'شناسه فروشگاه',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsNotEmpty()
  storeId!: string;

  @ApiProperty({
    description: 'شناسه روش ارسال (storeShippingMethods)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  shippingId!: string;

  @ApiProperty({ description: 'نام روش ارسال', })
  @IsOptional()
  @IsString()
  shippingName!: string;

  @ApiProperty({ description: 'هزینه روش ارسال', })
  @IsOptional()
  @IsString()
  shippingCost!: string;

  @ApiProperty({ description: 'زمان ارسال (تعداد روز)' })
  @IsOptional()
  @IsNumber()
  shippingTime!: number;

  @ApiProperty({ description: 'توضیحات سفارش', })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CreateCheckoutDto {
  @ApiPropertyOptional({
    description: 'شناسه آدرس ذخیره‌شده کاربر (در صورت انتخاب آدرس قبلی)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID()
  addressId?: string;

  @ApiProperty({
    description: 'لیست سفارشات',
    type: [CheckoutItemDto],
    example: [
      {
        storeId: '123e4567-e89b-12d3-a456-426614174000',
        shippingId: '123e4567-e89b-12d3-a456-426614174001',
      },
      {
        storeId: '123e4567-e89b-12d3-a456-426614174002',
        shippingId: '123e4567-e89b-12d3-a456-426614174003',
      },
    ],
    required: true,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  @ArrayMinSize(1)
  orders!: CheckoutItemDto[];

  @ApiPropertyOptional({
    description: 'کد تخفیف (اختیاری)',
    nullable: true
  })
  @IsOptional()
  @IsString()
  discountId?: string | null;

  @ApiProperty({
    description: 'روش پرداخت',
    enum: ['card', 'wallet', 'cod', 'zarinpal'],
    example: 'zarinpal',
    required: true,
  })
  @IsIn(['card', 'wallet', 'cod', 'zarinpal'])
  paymentMethod!: string;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'روش پرداخت', enum: ['card', 'wallet', 'zarinpal'] })
  @IsString()
  method!: string;

  @ApiPropertyOptional({ description: 'شماره ارجاع درگاه' })
  @IsOptional()
  @IsString()
  gatewayRef?: string;
}

export class SearchCheckouts extends QueryDefaultDto {
  @IsOptional()
  @IsIn([...Object.values(PaymentStatus), 'All'])
  @ApiProperty({
    enum: [...Object.values(PaymentStatus), 'All'],
    required: false,
    description: 'وضعیت پرداخت سفارش',
  })
  paymentStatus?: PaymentStatus | "All";

  @IsOptional()
  @IsIn([...Object.values(OrderStatus), 'All'])
  @ApiProperty({
    enum: [...Object.values(OrderStatus), 'All'],
    required: false,
    description: 'وضعیت سفارش',
  })
  status?: OrderStatus | "All";

  @IsOptional()
  @IsIn([...Object.values(StatusDiscount), 'All'])
  @ApiProperty({
    enum: [...Object.values(StatusDiscount), 'All'],
    required: false,
    description: 'وضعیت تخفیف اعمال‌شده روی سفارش',
  })
  discountStatus?: StatusDiscount | "All";

  @IsOptional()
  @IsIn([...Object.values(PaymentMethod), 'All'])
  @ApiProperty({
    enum: [...Object.values(PaymentMethod), 'All'],
    required: false,
    description: 'روش پرداخت استفاده‌شده برای سفارش',
  })
  paymentMethod?: PaymentMethod | "All";

  @ApiPropertyOptional({
    description: 'شناسه تخفیف اعمال‌شده روی سفارش',
    required: false,
  })
  @IsOptional()
  @IsString()
  discountId?: string;

  @ApiPropertyOptional({
    description: 'شماره سفارش (Checkout) برای جستجو',
    required: false,
  })
  @IsOptional()
  @IsString()
  checkoutNumber?: string;

  @ApiPropertyOptional({
    description: 'شماره پیگیری پرداخت (Payment Reference)',
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentRef?: string;

  @ApiPropertyOptional({
    description: 'شناسه کاربر صاحب سفارش',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;
}

export class SearchOrders extends QueryDefaultDto {
  @ApiPropertyOptional({
    description: 'وضعیت پرداخت سفارش',
    default: 'new',
    enum: [PaymentStatus, 'All'],
    required: false,
  })
  @IsOptional()
  @IsString()
  paymentStatus?: PaymentStatus | 'All';

  @ApiPropertyOptional({
    description: 'شماره سفارش برای جستجو',
    required: false,
  })
  @IsOptional()
  @IsString()
  orderNumber?: string;

  @ApiPropertyOptional({
    description: 'کد رهگیری مرسوله پستی',
    required: false,
  })
  @IsOptional()
  @IsString()
  trackingCode?: string;

  @ApiPropertyOptional({
    description: 'شناسه روش ارسال فروشگاه',
    required: false,
  })
  @IsOptional()
  @IsString()
  storeShippingMethodId?: string;

  @ApiPropertyOptional({
    description: 'شناسه کاربر صاحب سفارش',
    required: false,
  })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({
    description: 'شناسه فروشگاه مربوط به سفارش',
    required: false,
  })
  @IsOptional()
  @IsString()
  storeId?: string;
}

// ============ DTO ============
export class UpdateCheckoutDto {
  @ApiPropertyOptional({
    description: 'نام گیرنده سفارش',
    example: 'رضاخانی',
    minLength: 3,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  shippingName?: string;

  @ApiPropertyOptional({
    description: 'شماره تماس گیرنده (۱۱ رقم با ۰۹ شروع)',
    example: '09390199977',
    pattern: '^09\\d{9}$',
    required: false,
  })
  @IsOptional()
  @IsString()
  shippingPhone?: string;

  @ApiPropertyOptional({
    description: 'استان مقصد',
    example: 'seed-province-tehran',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  shippingProvince?: string;

  @ApiPropertyOptional({
    description: 'شهر مقصد',
    example: 'seed-city-tehran',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  @IsOptional()
  @IsString()
  shippingCity?: string;

  @ApiPropertyOptional({
    description: 'آدرس کامل تحویل',
    example: 'فرحزاد- میدان فرحزاد-خ گلستان-بن بست لاله یکم-پ ۱۳-طبقه۲',
    minLength: 10,
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiPropertyOptional({
    description: 'کد پستی ۱۰ رقمی',
    example: '1981735345',
    pattern: '^\\d{10}$',
    required: false,
  })
  @IsOptional()
  @IsString()
  shippingPostal?: string;

  @ApiPropertyOptional({
    description: 'وضعیت سفارش',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'وضعیت سفارش معتبر نیست' })
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'وضعیت پرداخت',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(PaymentStatus, { message: 'وضعیت پرداخت معتبر نیست' })
  paymentStatus?: PaymentStatus;
}

export class updateStoreOrderDto {
  @ApiPropertyOptional({
    description: 'وضعیت سفارش',
    enum: OrderStatus,
    example: OrderStatus.PENDING,
    required: false,
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'وضعیت سفارش معتبر نیست' })
  status?: OrderStatus;

  @ApiPropertyOptional({
    description: 'شناسه فروشگاه مربوط به سفارش',
    required: false,
  })
  @IsString()
  storeId!: string;
}