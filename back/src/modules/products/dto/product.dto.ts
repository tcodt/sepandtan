/**
 * Product DTOs - اشیاء انتقال داده محصولات
 */
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, MaxLength, IsBoolean, IsDateString, IsArray, IsJSON, IsObject, IsIn } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { DefaultStatus, Prisma } from '../../../generated/prisma/client.js';

export class CreateProductDto {
  @ApiPropertyOptional({
    description: 'آرایه‌ای از آدرس های عکس‌های آپلودشده',
    type: [String],
    example: ['marketino/images/2026/10/screenshot-2026-06-27-172630-68ff17c7e9db.png', 'marketino/image/2026/10/screenshot-2026-06-08-161115-253371-5946.png'],
  })
  @IsOptional()
  @IsArray()
  images?: string[];

  @ApiProperty({ description: 'عنوان فارسی محصول', example: 'تیشرت مردانه' })
  @IsString()
  @MaxLength(300)
  title!: string;

  @ApiProperty({ description: 'اسلاگ باید به صورت یونیک باشد', example: 'shirt-man' })
  @IsString()
  @MaxLength(300)
  slug!: string;

  @ApiPropertyOptional({ description: 'تایتل بالای صفحه', example: 'خرید لباس ورزشی | سپندتان' })
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @ApiPropertyOptional({ description: 'توضیحات که به صورت json میتونه باشه', example: "متن توضیحات زاد راجب محصول که داخلش میتونه عکس یا چیز دیگه ای هم باشه" })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiProperty({ description: 'توضیحات فارسی محصول', example: ' توضیحات مختصر محصول که تی سئو نمایش داده بشه' })
  @IsString()
  description!: string;

  @IsOptional()
  @IsIn([...Object.values(DefaultStatus)])
  @ApiProperty({
    enum: [...Object.values(DefaultStatus)],
    required: false,
    description: 'وضعیت محصول که فقط در حالت آپدیت برای ادمین باید نمایشش بدی موقع ساخت چه ادمین یا فروشنده دسترسی ندارن',
  })
  status?: DefaultStatus;

  @ApiProperty({
    description: 'مشخصات محصول توی محصولات مثلا گوشی ها رو دیده باشی یه جدول دارن که اینطوری هستش توی بالای جدول هدر قرار میگیره و در بدنه جدول سطح قرار میگیره که میتونه یه ارایه باشه',
    example: { headers: ['مشخصات', 'توضیحات'], rows: [['رنگ', 'مشکی'], ['سایز های موجود', 'M , L , XL'], ['جنس بدنه', 'الیاف پنبه'], ['کیفیت محصول', 'بسیار بالا']] },
  })
  @IsOptional()
  @IsObject()
  productTable?: Prisma.InputJsonValue;

  @ApiProperty({ description: 'شناسه دسته‌بندی حتما باید ارسال شود', example: '820e47b7-20b3-4fb6-8e29-56d2766efabd' })
  @IsString()
  categoryId!: string;

  @ApiPropertyOptional({ required: false, description: 'برند الزامی به ارسال نیست', example: '820e47b7-20b3-4fb6-8e29-56d2766efabd' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiProperty({ required: false, example: '820e47b7-20b3-4fb6-8e29-56d2766efabd', description: 'نمایش این فرم فقط برای ادمین هستش در صورتی که نمایش داده نشه کاربری که میخواد محصول بسازه باید فروشنده هم باشه کاربر و ادمین و سوپر ادمین میتونن فروشنده باشن' })
  @IsString()
  @IsOptional()
  storeId?: string;
}

export class UpdateProductDto extends PartialType(CreateProductDto) { }

export class ProductFilterDto {
  @ApiPropertyOptional({ description: 'شناسه دسته‌بندی' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'شناسه فروشنده' })
  @IsOptional()
  @IsString()
  seller?: string;

  @ApiPropertyOptional({ description: 'وضعیت محصول' })
  @IsOptional()
  @IsString()
  status?: DefaultStatus;

  @ApiPropertyOptional({ description: 'حداقل قیمت' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'حداکثر قیمت' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'مرتب‌سازی', enum: ['price_asc', 'price_desc', 'newest', 'oldest', 'popular', 'rating'] })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ description: 'شماره صفحه', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'تعداد در هر صفحه', default: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class ProductSearchDto {
  @ApiPropertyOptional({ description: 'وضعیت محصول', enum: ['all', ...Object.values(DefaultStatus)] })
  @IsOptional()
  @IsString()
  status?: DefaultStatus | 'all';

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @ApiPropertyOptional({ example: false, description: 'محصول ویژه است یا خیر' })
  featured?: boolean;

  @ApiPropertyOptional({ description: 'آیدی تخفیف' })
  @IsOptional()
  @IsString()
  discountId?: string;

  @ApiPropertyOptional({ description: 'جستجوی متن محصول' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'مرتب‌سازی محصولات',
    enum: ['updatedAt', 'saleCount-up', 'saleCount-down', 'rating-up', 'rating-down', 'reviewCount-up', 'reviewCount-down']
  })
  @IsOptional()
  @IsString()
  @IsIn(['updatedAt', 'saleCount-up', 'saleCount-down', 'rating-up', 'rating-down', 'reviewCount-up', 'reviewCount-down'])
  sort?: 'updatedAt' | 'saleCount-up' | 'saleCount-down' | 'rating-up' | 'rating-down' | 'reviewCount-up' | 'reviewCount-down';

  @ApiPropertyOptional({ description: 'بر اساس دسته‌بندی خاص' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'محصولات یک فروشنده خاص' })
  @IsOptional()
  @IsString()
  sellerId?: string;

  @ApiPropertyOptional({ description: 'برند خاص' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ example: 1, description: 'شماره صفحه' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ example: 10, description: 'تعداد آیتم در هر صفحه' })
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;
}