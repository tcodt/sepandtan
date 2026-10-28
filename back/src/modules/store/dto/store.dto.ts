import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';
import { BusinessType, DefaultStatus } from '../../../generated/prisma/enums.js';

export enum SortOptionStore {
  OLDEST = 'oldest',
  NEWEST = 'newest',
  BEST_SELLING = 'best_selling',
  BAD_SELLING = 'bad_selling',
  MORE_REVIEWS = 'more_reviews',
  LOW_REVIEWS = 'low_reviews',
  MORE_RATE = 'more_rate',
  LOW_RATE = 'low_rate',
  MORE_QUALITY = 'more_quality',
  LOW_QUALITY = 'low_quality',
  BEST_RESPONSE_RATE = 'more_response_rate',
  LOW_RESPONSE_RATE = 'low_response_rate',
  LOW_ANSWERED = 'low_answered',
  MORE_PRODUCTS = 'more_products',
  LOW_PRODUCTS = 'low_products'
}

export enum StoreReviewStatusFilter {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ALL = 'All',
}
export class SearchAdminStoreReview extends QueryDefaultDto {
  @ApiPropertyOptional({ description: 'وضعیت نظرات', enum: StoreReviewStatusFilter, required: false })
  @IsOptional()
  @IsEnum(StoreReviewStatusFilter)
  status?: StoreReviewStatusFilter

  @ApiPropertyOptional({ description: 'آیدی فروشگاه', required: false })
  @IsOptional()
  @IsString()
  storeId?: string

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @ApiProperty({ description: 'نمایش فقط خریداران', required: false })
  verifiedPurchase?: boolean;
}

export class SearchUserStore extends QueryDefaultDto {
  @ApiProperty({ description: 'نام فروشگاه', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'نوع مرتب‌سازی', enum: SortOptionStore, default: SortOptionStore.NEWEST })
  @IsOptional()
  @IsEnum(SortOptionStore)
  sortBy?: SortOptionStore = SortOptionStore.NEWEST;


  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @ApiProperty({ description: 'برای زمانی که یه لیست از فروشگاه های فعال رو به کاربر توی فرم های انتخاب گر نشون بدی', required: false, example: false })
  forSelect?: boolean;
}

export function ToBoolean() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1';
    }
    return false;
  });
}

export class SearchAdminStore extends QueryDefaultDto {
  @ApiProperty({ description: 'نام فروشگاه', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'نوع مرتب‌سازی', enum: SortOptionStore, default: SortOptionStore.NEWEST })
  @IsOptional()
  @IsEnum(SortOptionStore)
  sortBy?: SortOptionStore = SortOptionStore.NEWEST;

  @ApiPropertyOptional({ description: 'نوع وضعیت', enum: DefaultStatus, default: DefaultStatus.PENDING })
  @IsOptional()
  @IsEnum(DefaultStatus)
  status?: DefaultStatus;

  @ApiPropertyOptional({ description: 'فروشگاه های فعال' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isActive?: boolean;


  @ApiPropertyOptional({ description: 'فروشگاه های تایید شده' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  isVerified?: boolean;
}

export class CreateStoreDto {
  @ApiPropertyOptional({ description: 'فروشگاه حضوری دارد', type: Boolean, example: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return false;
  })
  hasPhysicalStore?: boolean

  @ApiProperty({
    description: 'نام فروشگاه (فارسی)',
    example: 'فروشگاه الکترونیک بازار',
  })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'اسلاگ فروشگاه (منحصر‌به‌فرد)',
    example: 'marketino-electronics',
  })
  @IsString()
  slug!: string;

  @ApiPropertyOptional({
    description: 'آدرس لوگو فروشگاه',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsUrl()
  logo?: string;

  @ApiPropertyOptional({
    description: 'آدرس بنر فروشگاه',
    example: 'https://example.com/banner.png',
  })
  @IsOptional()
  @IsUrl()
  banner?: string;

  @ApiPropertyOptional({
    description: 'توضیحات فروشگاه (فارسی)',
    example: 'فروشگاه تخصصی محصولات الکترونیک با بهترین قیمت',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'نوع کسب‌وکار',
    example: 'INDIVIDUAL',
    enum: BusinessType
  })
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @ApiPropertyOptional({
    description: 'شناسه کاربر',
    example: '217b4ad1-92ec-4747-8240-520ce44384a6',
  })
  @IsString()
  userId!: string;

  @ApiPropertyOptional({
    description: 'شناسه ملی',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({
    description: 'کد اقتصادی',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  economicCode?: string;

  @ApiPropertyOptional({
    description: 'استان',
    example: '217b4ad1-92ec-4747-8240-520ce44384a6',
  })
  @IsOptional()
  @IsString()
  provinceId!: string;

  @ApiPropertyOptional({
    description: 'شهر',
    example: '217b4ad1-92ec-4747-8240-520ce44384a6',
  })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({
    description: 'آدرس کامل',
    example: 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'شماره تلفن',
    example: '09121234567',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'ایمیل فروشگاه',
    example: 'info@marketino.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'اینستاگرام',
    example: 'https://instagram.com/marketino',
  })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({
    description: 'واتس اپ',
    example: 'https://whatsApp.com/marketino',
  })
  @IsOptional()
  @IsString()
  whatsApp?: string;

  @ApiPropertyOptional({
    description: 'بله',
    example: 'https://bale.com/marketino',
  })
  @IsOptional()
  @IsString()
  bale?: string;

  @ApiPropertyOptional({
    description: 'روبیکا',
    example: 'https://robika.com/marketino',
  })
  @IsOptional()
  @IsString()
  robika?: string;

  @ApiPropertyOptional({
    description: 'مدت زمانی که طول میکشد تا فروشنده کالا را به پستچی تحویل دهد ',
    example: 'هر روز ساعت 15',
  })
  @IsOptional()
  @IsString()
  shippingTime?: string;

  @ApiPropertyOptional({
    description: 'تلگرام',
    example: 'https://t.me/marketino',
  })
  @IsOptional()
  @IsString()
  telegram?: string;

  @ApiPropertyOptional({
    description: 'ساعت کاری یا پاسخگویی',
    example: '۸:۰۰ تا ۲۲:۰۰',
  })
  @IsOptional()
  @IsString()
  workingHours?: string;
}

export class UpdateStoreDto {
  @ApiPropertyOptional({
    description: 'وضعیت فروشگاه',
    example: DefaultStatus.APPROVED,
    enum: DefaultStatus
  })
  @IsOptional()
  @IsEnum(DefaultStatus)
  status?: DefaultStatus;

  @ApiPropertyOptional({
    description: 'نام فروشگاه (فارسی)',
    example: 'فروشگاه الکترونیک بازار',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'اسلاگ فروشگاه (منحصر‌به‌فرد)',
    example: 'marketino-electronics',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({
    description: 'آدرس لوگو فروشگاه',
    example: 'https://example.com/logo.png',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({
    description: 'آدرس بنر فروشگاه',
    example: 'https://example.com/banner.png',
  })
  @IsOptional()
  @IsString()
  banner?: string;

  @ApiPropertyOptional({
    description: 'توضیحات فروشگاه (فارسی)',
    example: 'فروشگاه تخصصی محصولات الکترونیک با بهترین قیمت',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'نوع کسب‌وکار حقوقی یا حقیقی',
    example: 'INDIVIDUAL',
    enum: BusinessType
  })
  @IsOptional()
  @IsEnum(BusinessType)
  businessType?: BusinessType;

  @ApiPropertyOptional({
    description: 'شناسه ملی',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  nationalId?: string;

  @ApiPropertyOptional({
    description: 'کد اقتصادی',
    example: '1234567890',
  })
  @IsOptional()
  @IsString()
  economicCode?: string;

  @ApiPropertyOptional({
    description: 'استان',
    example: '217b4ad1-92ec-4747-8240-520ce44384a6',
  })
  @IsOptional()
  @IsString()
  provinceId?: string;

  @ApiPropertyOptional({
    description: 'شهر',
    example: '217b4ad1-92ec-4747-8240-520ce44384a6',
  })
  @IsOptional()
  @IsString()
  cityId?: string;

  @ApiPropertyOptional({
    description: 'آدرس کامل',
    example: 'تهران، خیابان ولیعصر، پلاک ۱۲۳',
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    description: 'شماره تلفن',
    example: '02112345678',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'ایمیل فروشگاه',
    example: 'info@marketino.com',
  })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({
    description: 'آیا اینستاگرام',
    example: 'https://instagram.com/marketino',
  })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({
    description: 'آیا تلگرام',
    example: 'https://t.me/marketino',
  })
  @IsOptional()
  @IsString()
  telegram?: string;

  @ApiPropertyOptional({
    description: 'ساعت کاری یا پاسخگویی',
    example: '۸:۰۰ تا ۲۲:۰۰',
  })
  @IsOptional()
  @IsString()
  workingHours?: string;

  @ApiPropertyOptional({ description: 'فروشگاه حضوری دارد', type: Boolean, example: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return false;
  })
  hasPhysicalStore?: boolean

  @ApiPropertyOptional({ description: 'توضیحات برای رد یا تایید وضعیت', example: '', })
  @IsOptional()
  @IsString()
  statusReason?: string

  @ApiPropertyOptional({
    description: 'درصد کمیسیون (مثلاً 4.5 برای ۴.۵ درصد)',
    example: 4.5,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'درصد کمیسیون باید عدد باشد' })
  @Min(0)
  @Max(100)
  commissionRate?: number;

  @ApiPropertyOptional({
    description: 'آیا واتس اپ',
    example: 'https://whatsApp.com/marketino',
  })
  @IsOptional()
  @IsString()
  whatsApp?: string;

  @ApiPropertyOptional({
    description: 'آیا بله',
    example: 'https://bale.com/marketino',
  })
  @IsOptional()
  @IsString()
  bale?: string;

  @ApiPropertyOptional({
    description: 'آیا روبیکا',
    example: 'https://robika.com/marketino',
  })
  @IsOptional()
  @IsString()
  robika?: string;

  @ApiPropertyOptional({
    description: 'مدت زمانی که طول میکشد تا فروشنده کالا را به پستچی تحویل دهد ',
    example: 'هر روز ساعت 15',
  })
  @IsOptional()
  @IsString()
  shippingTime?: string;

  @ApiPropertyOptional({ description: 'فروشگاه تاییدیه دارد', type: Boolean, example: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return false;
  })
  isVerified?: boolean

  @ApiPropertyOptional({ description: 'فروشگاه فعالیت دارد', type: Boolean, example: false })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return false;
  })
  isActive?: boolean
}

export class UpdateStoreStatusDto {
  @ApiProperty({
    description: 'وضعیت فروشگاه',
    enum: DefaultStatus,
  })
  @IsEnum(DefaultStatus)
  status!: DefaultStatus;

  @ApiPropertyOptional({
    description: 'دلیل تغییر وضعیت',
    example: 'اطلاعات کامل و معتبر',
  })
  @IsOptional()
  @IsString()
  statusReason?: string;
}

export class CreateStoreReviewDto {
  @ApiProperty({
    description: 'امتیاز فروشگاه (۱ تا ۵)',
    minimum: 1,
    maximum: 5,
    example: 4.5,
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating!: number;

  @ApiPropertyOptional({
    description: 'متن نظر',
    example: 'فروشگاه عالی، محصولات با کیفیت و ارسال سریع',
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({
    description: 'امتیاز کیفیت محصولات (۱ تا ۵)',
    minimum: 1,
    maximum: 5,
    example: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  productQuality?: number;
}

export class AnswerStoreReviewDto {
  @ApiProperty({
    description: 'پاسخ به نظر',
    example: 'ممنون از نظر شما، خوشحالیم که راضی بودید',
  })
  @IsString()
  answerReview!: string;
}

export class UpdateStoreReviewStatusDto {
  @ApiProperty({
    description: 'وضعیت نظر',
    enum: DefaultStatus,
    example: DefaultStatus.PENDING,
  })
  @IsEnum(DefaultStatus)
  status!: DefaultStatus;

  @ApiPropertyOptional({
    description: 'دلیل تغییر وضعیت نظر',
    example: 'تایید شد',
  })
  @IsOptional()
  @IsString()
  statusReason?: string;
}
