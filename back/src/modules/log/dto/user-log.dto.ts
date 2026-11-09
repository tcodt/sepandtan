import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsArray, IsUUID, IsInt,
  Min, Max, MaxLength, ArrayMaxSize, Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'تاریخ باید به فرمت YYYY-MM-DD باشد';

// ---------- Create (بخش‌های ورزش/تغذیه/وزن همه اختیاری) ----------
export class CreateUserLogDto {
  @ApiProperty({ example: '2026-11-07', description: 'تاریخ میلادی روز به وقت تهران (YYYY-MM-DD)' })
  @Matches(DATE_REGEX, { message: DATE_MESSAGE })
  date!: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', description: 'userPlanId اختیاری' })
  @IsOptional() @IsUUID('4')
  userPlanId?: string;

  @ApiPropertyOptional({ example: 75.5 })
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  weightKg?: number;

  @ApiPropertyOptional({ type: [String], example: [] })
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true })
  doneExerciseIds?: string[];

  @ApiPropertyOptional({
    type: 'array',
    example: [{ name: 'دویدن', durationMin: 20, caloriesBurned: 200, note: '' }],
  })
  @IsOptional() @IsArray() @ArrayMaxSize(20)
  extraExercises?: { name: string; durationMin?: number; caloriesBurned?: number; note?: string }[];

  @ApiPropertyOptional({ example: 200 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  caloriesBurned?: number;

  @ApiPropertyOptional({ type: [String], example: [] })
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true })
  doneMealIds?: string[];

  @ApiPropertyOptional({
    type: 'array',
    example: [{ name: 'سیب', calories: 95, proteinG: 0, carbsG: 25, fatG: 0 }],
  })
  @IsOptional() @IsArray() @ArrayMaxSize(20)
  extraMeals?: { name: string; calories?: number; proteinG?: number; carbsG?: number; fatG?: number }[];

  @ApiPropertyOptional({
    example: 2000,
    description: 'فقط وقتی استفاده می‌شود که لاگ به برنامه وصل نباشد؛ در غیر این صورت از برنامه خوانده می‌شود',
  })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  caloriesPlanned?: number;

  @ApiPropertyOptional({ example: 1800 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  caloriesConsumed?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  proteinG?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  carbsG?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  fatG?: number;

  @ApiPropertyOptional({ example: 'احساس خوبی داشتم' })
  @IsOptional() @IsString() @MaxLength(2000)
  userNote?: string;
}

/**
 * date و userPlanId قابل ویرایش نیستند:
 * jalaliYear / jalaliMonth و planned* از روی همین دو مقدار ساخته می‌شوند
 * و فقط در create محاسبه می‌شوند تا همیشه با date هماهنگ بمانند.
 * اگر تاریخ اشتباه بود: حذف + ثبت دوباره.
 */
export class UpdateUserLogDto extends PartialType(
  OmitType(CreateUserLogDto, ['date', 'userPlanId'] as const),
) {}

export class UpdateCoachNoteDto {
  @ApiProperty({ example: 'عالی بود' })
  @IsString() @MaxLength(2000)
  coachNote!: string;
}

// ---------- Stats ----------
export class MonthlyStatsQueryDto {
  @ApiProperty({ example: 1405, description: 'سال شمسی' })
  @Type(() => Number) @IsInt() @Min(1300) @Max(1500)
  year!: number;
}

export class WeeklyStatsQueryDto {
  @ApiProperty({ example: '2026-09-01', description: 'شروع بازه (میلادی، YYYY-MM-DD)' })
  @Matches(DATE_REGEX, { message: DATE_MESSAGE })
  from!: string;

  @ApiProperty({ example: '2026-11-07', description: 'پایان بازه (میلادی، YYYY-MM-DD) — حداکثر ۴۰۰ روز' })
  @Matches(DATE_REGEX, { message: DATE_MESSAGE })
  to!: string;
}
