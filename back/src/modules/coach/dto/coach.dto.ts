import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { AchievementScope, AchievementType, CertificationType, CoachStatus, DefaultStatus } from '../../../generated/prisma/enums.js';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';

export enum SortOptionCoach {
    OLDEST = 'oldest',
    NEWEST = 'newest',
    MORE_SELLING = 'more_selling',
    LOW_SELLING = 'low_selling',
    MORE_REVIEWS = 'more_reviews',
    LOW_REVIEWS = 'low_reviews',
    MORE_RATE = 'more_rate',
    LOW_RATE = 'low_rate',
}
export class CreateCoachDto {
    @ApiPropertyOptional({
        description: 'آیدی کاربر',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @IsUUID('4', { message: 'آیدی کاربر باید UUID باشد' })
    @IsString()
    userId!: string

    @ApiPropertyOptional({
        description: 'کد ملی نمایش برای مربی و فقط ادمین',
        example: '0012345678',
    })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    nationalId?: string;

    @ApiPropertyOptional({
        description: 'آیدی شهر',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @IsOptional()
    @IsUUID('4', { message: 'آیدی شهر باید UUID باشد' })
    cityId?: string;

    @ApiPropertyOptional({
        description: 'آیدی استان',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @IsOptional()
    @IsUUID('4', { message: 'آیدی استان باید UUID باشد' })
    provinceId?: string;

    @ApiPropertyOptional({
        description: 'آیدی آدرس',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @IsOptional()
    @IsUUID('4', { message: 'آیدی آدرس باید UUID باشد' })
    addressId?: string

    @ApiPropertyOptional({
        description: 'عنوان/تیتر مربی',
        example: 'مربی بدنسازی و تغذیه',
    })
    @IsString()
    slug!: string;

    @ApiPropertyOptional({
        description: 'اسم مربی یا باشگاه یا اسم مستعار',
        example: 'بدنسازی رویایی',
    })
    @IsString()
    title!: string;

    @ApiPropertyOptional({
        description: 'عنوان/تیتر مربی',
        example: 'مربی بدنسازی و تغذیه',
    })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    headline?: string;

    @ApiPropertyOptional({
        description: 'بیوگرافی مربی',
        example: 'دارای ۵ سال سابقه مربیگری...',
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    bio?: string;

    @ApiPropertyOptional({
        description: 'آیدی اینستاگرام',
        example: 'coach_ali',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    instagram?: string;

    @ApiPropertyOptional({
        description: 'درصد کمیسیون (0 تا 100) فقط باید توسط ادمین تغییر بکنه برای مربی نمایش نده',
        example: 15.5,
        minimum: 0,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(100)
    commissionRate?: number;

    @ApiPropertyOptional({
        description: 'حداکثر تعداد مشتری به صورت خودکار 20 واحد در نظر گرفته میشود',
        example: 20,
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    maxClients?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @ApiPropertyOptional({ example: false, description: 'پذیرش دارد یا خیر' })
    isAcceptingClients?: boolean;

    @IsIn([...Object.values(CoachStatus)])
    @ApiProperty({
        enum: [...Object.values(CoachStatus)],
        required: false,
        description: 'وضعیت مربی',
    })
    status!: CoachStatus

    @ApiPropertyOptional({
        description: 'دلیل رد شدن (فقط توسط ادمین تنظیم می‌شود)',
        example: 'دلیل رد شدن (فقط توسط ادمین تنظیم می‌شود) کاربر مجاز به ارسال نیست',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    rejectionReason?: string;

    @ApiPropertyOptional({ description: 'سال‌های تجربه', example: '2026-10-24T21:24:44.150Z', format: 'date' })
    @IsOptional()
    @IsDateString()
    experienceYears?: string;
}

export class UpdateCoachDto {
    @ApiPropertyOptional({
        description: 'کد ملی',
        example: '0012345678',
    })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    nationalId?: string;

    @ApiPropertyOptional({
        description: 'آیدی شهر',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @IsOptional()
    @IsUUID('4', { message: 'آیدی شهر باید UUID باشد' })
    cityId?: string;

    @ApiPropertyOptional({
        description: 'آیدی استان',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @IsOptional()
    @IsUUID('4', { message: 'آیدی استان باید UUID باشد' })
    provinceId?: string;

    @ApiPropertyOptional({
        description: 'آیدی آدرس',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @IsOptional()
    @IsUUID('4', { message: 'آیدی آدرس باید UUID باشد' })
    addressId?: string

    @ApiPropertyOptional({
        description: 'ویرایش اسلاگ فقط توسط ادمین',
        example: 'بدنسازی رویایی',
    })
    @IsString()
    slug!: string;

    @ApiPropertyOptional({
        description: 'ویرایش تایتل فقط توسط ادمین',
        example: 'بدنسازی رویایی',
    })
    @IsString()
    title!: string;

    @ApiPropertyOptional({
        description: 'عنوان/تیتر مربی',
        example: 'مربی بدنسازی و تغذیه',
    })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    headline?: string;

    @ApiPropertyOptional({
        description: 'بیوگرافی مربی',
        example: 'دارای ۵ سال سابقه مربیگری...',
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    bio?: string;

    @ApiPropertyOptional({
        description: 'آیدی اینستاگرام',
        example: 'coach_ali',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    instagram?: string;

    @ApiPropertyOptional({
        description: 'درصد کمیسیون (0 تا 100) فقط باید توسط ادمین تغییر بکنه برای مربی نمایش نده',
        example: 15.5,
        minimum: 0,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(100)
    commissionRate?: number;

    @ApiPropertyOptional({
        description: 'حداکثر تعداد مشتری به صورت خودکار 20 واحد در نظر گرفته میشود',
        example: 20,
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    maxClients?: number;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @ApiPropertyOptional({ example: false, description: 'پذیرش دارد یا خیر' })
    isAcceptingClients?: boolean;

    @IsIn([...Object.values(CoachStatus)])
    @ApiProperty({
        enum: [...Object.values(CoachStatus)],
        required: false,
        description: 'وضعیت مربی',
    })
    status!: CoachStatus

    @ApiPropertyOptional({
        description: 'دلیل رد شدن (فقط توسط ادمین تنظیم می‌شود)',
        example: 'دلیل رد شدن (فقط توسط ادمین تنظیم می‌شود) کاربر مجاز به ارسال نیست',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    rejectionReason?: string;

    @ApiPropertyOptional({ description: 'سال‌های تجربه', example: '2026-10-24T21:24:44.150Z', format: 'date' })
    @IsOptional()
    @IsDateString()
    experienceYears?: string;
}

export class SearchCoachDto extends QueryDefaultDto {
    @ApiPropertyOptional({ required: false, description: 'توی اسلاگ و تایتل مربی جستجو میشه' })
    @IsOptional()
    @IsString()
    search?: string

    @ApiPropertyOptional({ description: 'نوع مرتب‌سازی', enum: SortOptionCoach, default: SortOptionCoach.NEWEST })
    @IsOptional()
    @IsEnum(SortOptionCoach)
    sortBy?: SortOptionCoach = SortOptionCoach.NEWEST;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @ApiPropertyOptional({ example: false, description: 'پذیرش دارد یا خیر' })
    isAcceptingClients?: boolean;

    @ApiPropertyOptional({ required: false, description: 'آیدی شهر' })
    @IsOptional()
    @IsUUID('4', { message: 'آیدی شهر باید UUID باشد' })
    @IsString()
    cityId?: string

    @ApiPropertyOptional({ description: 'آیدی استان', })
    @IsOptional()
    @IsUUID('4', { message: 'آیدی استان باید UUID باشد' })
    @IsString()
    provinceId?: string
}
export class SearchAdminCoachDto extends SearchCoachDto {
    @IsOptional()
    @IsIn([...Object.values(CoachStatus), 'ALL'])
    @ApiProperty({
        enum: [...Object.values(CoachStatus), 'ALL'],
        required: false,
        description: 'وضعیت مربی این بخش رو به کاربر نمایش نده فقط برای ادمین ساختم',
    })
    status?: CoachStatus | "ALL";
}

//////// Review ///////

export class CreateCoachReviewDto {
    @ApiProperty({ description: 'آیدی مربی', example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    @IsUUID('4', { message: 'آیدی مربی باید UUID باشد' })
    coachId!: string;

    @ApiPropertyOptional({
        description: 'آیدی پلن کاربر (اختیاری — برای تأیید شاگرد واقعی)',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @IsOptional()
    @IsUUID('4', { message: 'آیدی پلن کاربر باید UUID باشد' })
    userPlanId?: string;

    @ApiPropertyOptional({
        description: 'آدرس تصاویر (حداکثر ۵ عکس)',
        type: [String],
        example: ['https://cdn.example.com/review/1.jpg'],
    })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(5, { message: 'حداکثر ۵ تصویر مجاز است' })
    @IsString({ each: true })
    images?: string[];

    @ApiProperty({ description: 'امتیاز به مربی (۱ تا ۵)', example: 5, minimum: 1, maximum: 5 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    coachRating!: number;

    @ApiProperty({ description: 'امتیاز به کیفیت برنامه (۱ تا ۵)', example: 4, minimum: 1, maximum: 5 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    planRating!: number;

    @ApiProperty({ description: 'امتیاز به کیفیت برنامه غذایی (۱ تا ۵)', example: 4, minimum: 1, maximum: 5 })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(5)
    dietRating!: number;

    @ApiPropertyOptional({ description: 'متن نظر', example: 'مربی خیلی خوبی بود...', maxLength: 2000 })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    body?: string;

    @ApiPropertyOptional({ description: 'نظر ناشناس باشد؟', example: false, default: false })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isAnonymous?: boolean;
}

export class UpdateCoachReviewDto {
    @IsOptional()
    @IsIn([...Object.values(DefaultStatus)])
    @ApiProperty({
        enum: [...Object.values(DefaultStatus)],
        required: false,
        description: 'وضعیت کامنت',
    })
    status!: DefaultStatus
}

export class ApprovedCoachReviewDto {
    @IsOptional()
    @ApiProperty({ description: 'متن پاسخ مربی', example: '' })
    @IsString()
    answerReview?: string;
}

export class SearchCoachReview extends QueryDefaultDto {
    @IsOptional()
    @IsIn([...Object.values(DefaultStatus), 'ALL'])
    @ApiProperty({
        enum: [...Object.values(DefaultStatus), 'ALL'],
        required: false,
        description: 'وضعیت مربی این بخش رو به کاربر نمایش نده فقط برای ادمین ساختم',
    })
    status?: DefaultStatus | "ALL";

    @IsOptional()
    @ApiProperty({ description: 'آیدی مربی', example: '' })
    @IsUUID('4', { message: 'آیدی مربی باید UUID باشد' })
    id?: string;

    @IsOptional()
    @ApiProperty({ description: 'آیدی مربی', example: '' })
    @IsUUID('4', { message: 'آیدی مربی باید UUID باشد' })
    coachId?: string;
}

//////// Achievement ///////
export class CreateAchievementDto {
    @ApiProperty({
        description: 'عنوان دستاورد',
        example: 'مدال طلای پرس سینه',
    })
    @IsString()
    @MaxLength(200)
    title!: string;

    @ApiProperty({
        enum: [...Object.values(AchievementType)],
        description: `
      نوع افتخار:
      * MEDAL // مدال قهرمانی
      * TROPHY // جام / مقام تیمی
      * TITLE // عنوان رسمی (مثلاً مربی سال)
      * AWARD // جایزه همایش / فدراسیون
      * RECORD // رکورد شخصی یا ملی
      * OTHER
    `,
        example: AchievementType.OTHER
    })
    @IsIn([...Object.values(AchievementType)])
    type!: AchievementType;

    @ApiProperty({
        enum: [...Object.values(AchievementScope)],
        description: `
      محدوده دستاورد:
      * LOCAL // محلی
      * NATIONAL // ملی
      * INTERNATIONAL // بین‌المللی
      * ACADEMIC // آکادمیک
      * OTHER
    `,
        example: AchievementScope.OTHER
    })
    @IsIn([...Object.values(AchievementScope)])
    scope!: AchievementScope;

    @ApiPropertyOptional({
        description: 'صادرکننده (فدراسیون، المپیک و...)',
        example: 'فدراسیون بدنسازی و پرورش اندام',
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    issuer?: string;

    @ApiPropertyOptional({
        description: 'رتبه کسب‌شده',
        example: 1,
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    place?: number;

    @ApiPropertyOptional({
        description: 'نام مسابقه / رویداد',
        example: 'مسابقات کشوری پرس سینه ۱۴۰۳',
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    eventName?: string;

    @ApiPropertyOptional({
        description: 'توضیحات',
        example: 'مدال طلا در وزن ۸۰ کیلوگرم',
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    description?: string;

    @ApiPropertyOptional({
        description: 'آدرس تصویر حکم / مدال',
        example: 'https://cdn.example.com/achievement/medal.jpg',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    documentUrl?: string;

    @ApiProperty({
        description: 'سال کسب دستاورد',
        example: '2024-01-01T00:00:00.000Z',
        format: 'date',
    })
    @IsDateString()
    year!: string;
}
export class UpdateAchievementDto extends PartialType(CreateAchievementDto) {}


//////// Availability ///////
export class CreateAvailabilityDto {
    @ApiProperty({
        description: 'شروع کلاس و حضور',
        example: '09:00',
    })
    @IsString()
    @MaxLength(100)
    startTime!: string;

    @ApiProperty({
        description: 'پایان کلاس و حضور',
        example: '13:00',
    })
    @IsString()
    @MaxLength(100)
    endTime!: string;

    @ApiPropertyOptional({
        description: 'ترتیب روزهای هفته از عدد 1 تا 7',
        example: 1,
        minimum: 1,
    })
    @Type(() => Number)
    @IsInt()
    @Min(1)
    weekday!: number;
}
export class UpdateAvailabilityDto extends PartialType(CreateAvailabilityDto) {}


//////// Certification ///////
export class CreateCertificationDto {
    @ApiProperty({
        enum: [...Object.values(CertificationType)],
        description: `
      نوع مدرک:
      * ACADEMIC // دانشگاهی (کارشناسی، ارشد، دکتری)
      * PROFESSIONAL // حرفه‌ای (مربیگری درجه ۱/۲/۳، CPR و...)
      * FEDERATION // فدراسیونی (فدراسیون بدنسازی و پرورش اندام)
      * WORKSHOP // کارگاه/دوره کوتاه‌مدت
      * OTHER
    `,
    })
    @IsEnum(CertificationType, { message: 'نوع مدرک نامعتبر است' })
    type!: CertificationType;

    @ApiProperty({
        description: 'عنوان مدرک',
        example: 'کارشناسی تربیت بدنی',
    })
    @IsString()
    @MaxLength(200)
    title!: string;

    @ApiProperty({
        description: 'آیدی مربی حتما ارسال بشه ایدی مربی باشه نه کاربر فرق دارن اینا',
        example: 'uuid',
    })
    @IsString()
    coachId!: string;

    @ApiPropertyOptional({
        description: 'رشته تحصیلی / تخصص',
        example: 'تربیت بدنی و علوم ورزشی',
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    field?: string;

    @ApiPropertyOptional({
        description: 'مقطع / درجه',
        example: 'کارشناسی',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    level?: string;

    @ApiPropertyOptional({
        description: 'صادرکننده',
        example: 'دانشگاه تهران / فدراسیون بدنسازی',
    })
    @IsOptional()
    @IsString()
    @MaxLength(200)
    issuer?: string;

    @ApiPropertyOptional({
        description: 'آدرس تصویر/اسکن مدرک',
        example: 'https://cdn.example.com/cert/1.jpg',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    documentUrl?: string;

    @ApiPropertyOptional({
        description: 'تاریخ انقضا (null = بدون انقضا)',
        example: '2025-09-01T00:00:00.000Z',
        format: 'date',
    })
    @IsOptional()
    @IsDateString()
    expiresAt?: string;

    @ApiPropertyOptional({
        description: 'مدرک اصلی/شاخص باشد؟ (فقط یکی می‌تواند primary باشد)',
        example: false,
        default: false,
    })
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    isPrimary?: boolean;
}
