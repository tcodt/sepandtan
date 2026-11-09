import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsInt, IsNumber, IsArray, IsEnum, IsUUID, IsDateString,
  Min, Max, MaxLength, ArrayMaxSize,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { MealType, PlanSource, Prioritytype } from '../../../generated/prisma/enums.js';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';

export enum SortOptionDietPlan {
  OLDEST = 'oldest',
  NEWEST = 'newest',
  MORE_PRICE = 'more_price',
  LOW_PRICE = 'low_price',
  MORE_RATE = 'more_rate',
  LOW_RATE = 'low_rate',
}

export class CreateDietPlanDto {
  @ApiProperty({ example: 'برنامه غذایی حجم ۸ هفته' })
  @IsString() @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'برنامه ۸ هفته‌ای مناسب افزایش حجم' })
  @IsOptional() @IsString() @MaxLength(5000)
  description?: string;

  @ApiProperty({ type: [String], example: ['https://cdn.example.com/diet/cover.jpg'] })
  @IsArray() @ArrayMaxSize(10) @IsString({ each: true }) @MaxLength(500, { each: true })
  coverImage!: string[];

  @ApiProperty({ example: 500000, description: 'قیمت اصلی (تومان). ۰ = رایگان' })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(999_999_999_999)
  price!: number;

  @ApiPropertyOptional({ example: 400000, description: 'قیمت با تخفیف؛ نباید از price بیشتر باشد' })
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(999_999_999_999)
  discountPrice?: number;

  @ApiPropertyOptional({ example: '2026-12-30T00:00:00.000Z', description: 'پایان تخفیف (ISO 8601)' })
  @IsOptional() @IsDateString()
  discountExpired?: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'هدف تمرینی' })
  @IsOptional() @IsUUID('4')
  trainingGoalId?: string;

  @ApiPropertyOptional({ example: 2500, description: 'کالری هدف روزانه (پیش‌فرض کل برنامه)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(20000)
  targetCalories?: number;

  @ApiPropertyOptional({ example: 150, description: 'گرم' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2000)
  targetProteinG?: number;

  @ApiPropertyOptional({ example: 250, description: 'گرم' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2000)
  targetCarbsG?: number;

  @ApiPropertyOptional({ example: 70, description: 'گرم' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2000)
  targetFatG?: number;

  @ApiPropertyOptional({ example: 8, description: 'مدت برنامه به هفته (۱ تا ۱۰۴)' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(104)
  durationWeeks?: number;
}

export class UpdateDietPlanDto extends PartialType(CreateDietPlanDto) { }

// ---------- Phase ----------
export class CreateDietPhaseDto {
  @ApiProperty({ example: 'فاز کات — هفته ۱ تا ۴' })
  @IsString() @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 1, description: 'هفته‌ی شروع (شامل)' })
  @Type(() => Number) @IsInt() @Min(1) @Max(104)
  startWeek!: number;

  @ApiProperty({ example: 4, description: 'هفته‌ی پایان (شامل)؛ باید ≥ startWeek باشد' })
  @Type(() => Number) @IsInt() @Min(1) @Max(105)
  endWeek!: number;

  @ApiPropertyOptional({ example: 1, description: 'ترتیب نمایش؛ پیش‌فرض = startWeek' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number;

  @ApiPropertyOptional({ example: 2200, description: 'کالری هدف این فاز؛ اگر نباشد از خود برنامه خوانده می‌شود' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(20000)
  targetCalories?: number;

  @ApiPropertyOptional({ example: 140 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2000)
  targetProteinG?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2000)
  targetCarbsG?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2000)
  targetFatG?: number;
}

export class UpdateDietPhaseDto extends PartialType(CreateDietPhaseDto) { }

// ---------- Day ----------
export class CreateDietDayDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'فاز والد (الزامی؛ باید متعلق به همین برنامه باشد)' })
  @IsUUID('4')
  dietPhaseId!: string;

  @ApiProperty({ example: 0, description: '۰=شنبه … ۶=جمعه. در هر فاز هر weekday فقط یک بار' })
  @Type(() => Number) @IsInt() @Min(0) @Max(6)
  weekday!: number;

  @ApiPropertyOptional({ example: 'روز تمرین پا' })
  @IsOptional() @IsString() @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'آب بیشتر بنوشید' })
  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}

/** انتقال روز به فاز دیگر مجاز نیست (dietPhaseId حذف شده)؛ برای انتقال از «کپی روز» استفاده کن */
export class UpdateDietDayDto extends PartialType(
  OmitType(CreateDietDayDto, ['dietPhaseId'] as const),
) { }

export class CopyDietDayDto {
  @ApiProperty({ example: 2, description: 'weekday مقصد (۰=شنبه … ۶=جمعه)' })
  @Type(() => Number) @IsInt() @Min(0) @Max(6)
  weekday!: number;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'فاز مقصد (باید متعلق به همین برنامه باشد). اگر نباشد، همان فاز روز مبدأ',
  })
  @IsOptional() @IsUUID('4')
  dietPhaseId?: string;
}

// ---------- Meal ----------
export class CreateDietMealDto {
  @ApiProperty({ enum: [...Object.values(MealType)], example: 'BREAKFAST' })
  @IsEnum(MealType)
  type!: MealType;

  @ApiPropertyOptional({
    enum: [...Object.values(Prioritytype)],
    example: 'PRIMARY',
    description: 'PRIMARY = وعده‌ی اصلی (در جمع کالری روز حساب می‌شود). SECONDARY/TERTIARY = جایگزین. پیش‌فرض PRIMARY',
  })
  @IsOptional() @IsEnum(Prioritytype)
  priority?: Prioritytype;

  @ApiProperty({ example: 1, description: 'ترتیب نمایش در روز' })
  @Type(() => Number) @IsInt() @Min(0) @Max(100)
  order!: number;

  @ApiPropertyOptional({ example: 'یک ساعت قبل از تمرین' })
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}

export class UpdateDietMealDto extends PartialType(CreateDietMealDto) { }

// ---------- Meal Item ----------
export class CreateDietMealItemDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'باید غذای فعال باشد' })
  @IsUUID('4')
  foodId!: string;

  @ApiProperty({ example: 150, description: 'مقدار به گرم (۰.۰۱ تا ۹۹۹۹)' })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(9999)
  quantityGrams!: number;

  @ApiPropertyOptional({ example: 'پخته' })
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}

export class UpdateDietMealItemDto extends PartialType(CreateDietMealItemDto) { }

export class SearchPlanDietUser extends QueryDefaultDto {
  @ApiPropertyOptional({ description: 'نوع مرتب‌سازی', enum: SortOptionDietPlan })
  @IsOptional()
  @IsEnum(SortOptionDietPlan)
  sortBy?: SortOptionDietPlan;

  @ApiPropertyOptional({ required: false, description: 'توی تایتل پلن جستجو میشه' })
  @IsOptional()
  @IsString()
  title?: string
}

export class SearchPlanDietCoach extends QueryDefaultDto {
  @ApiPropertyOptional({ description: 'نوع مرتب‌سازی', enum: SortOptionDietPlan })
  @IsOptional()
  @IsEnum(SortOptionDietPlan)
  sortBy?: SortOptionDietPlan;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @ApiPropertyOptional({ example: false, description: 'وضعیت انتشار' })
  isPublished?: boolean;

  @ApiPropertyOptional({ required: false, description: 'توی تایتل پلن جستجو میشه' })
  @IsOptional()
  @IsString()
  title?: string
}

export class SearchPlanDietAdmin extends SearchPlanDietCoach {
  @ApiPropertyOptional({ required: false, description: 'آیدی مربی' })
  @IsOptional()
  @IsString()
  coachId?: string

  @ApiPropertyOptional({ description: 'نوع پلن', enum: PlanSource })
  @IsOptional()
  @IsEnum(PlanSource)
  source?: PlanSource;
}