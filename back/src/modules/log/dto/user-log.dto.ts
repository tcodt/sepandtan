import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsNumber, IsArray, IsUUID, IsInt, IsEnum, IsISO8601,
  Min, Max, MaxLength, ArrayMaxSize, Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'تاریخ باید به فرمت YYYY-MM-DD باشد';

// ---------- Create ----------
export class CreateUserLogDto {
  @ApiProperty({ example: '2026-11-07', description: 'تاریخ میلادی روز به وقت تهران (YYYY-MM-DD)' })
  @Matches(DATE_REGEX, { message: DATE_MESSAGE })
  date!: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsOptional() @IsUUID('4')
  userPlanId?: string;

  @ApiPropertyOptional({ example: 75.5 })
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(20) @Max(400)
  weightKg?: number;

  /** id تمرین‌هایی که انجام نشدند (از لیست planned همان روز) */
  @ApiPropertyOptional({ type: [String], example: [] })
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true })
  unCompletedExerciseIds?: string[];

  @ApiPropertyOptional({
    type: 'array',
    example: [{ name: 'دویدن', durationMin: 20, caloriesBurned: 200, note: '' }],
  })
  @IsOptional() @IsArray() @ArrayMaxSize(20)
  extraExercises?: { name: string; durationMin?: number; caloriesBurned?: number; note?: string }[];

  @ApiPropertyOptional({ example: 200 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(20000)
  caloriesBurned?: number;

  /** id وعده‌هایی که انجام نشدند */
  @ApiPropertyOptional({ type: [String], example: [] })
  @IsOptional() @IsArray() @ArrayMaxSize(50) @IsString({ each: true })
  unCompletedMealIds?: string[];

  @ApiPropertyOptional({
    type: 'array',
    example: [{ name: 'سیب', calories: 95, proteinG: 0, carbsG: 25, fatG: 0 }],
  })
  @IsOptional() @IsArray() @ArrayMaxSize(20)
  extraMeals?: { name: string; calories?: number; proteinG?: number; carbsG?: number; fatG?: number }[];

  @ApiPropertyOptional({
    example: 2000,
    description: 'فقط وقتی لاگ به برنامه وصل نیست؛ وگرنه از snapshot/فاز خوانده می‌شود',
  })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(20000)
  caloriesPlanned?: number;

  @ApiPropertyOptional({ example: 1800 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(20000)
  caloriesConsumed?: number;

  @ApiPropertyOptional({ example: 120 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(1000)
  proteinG?: number;

  @ApiPropertyOptional({ example: 200 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2000)
  carbsG?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(1000)
  fatG?: number;

  @ApiPropertyOptional({ example: 'احساس خوبی داشتم' })
  @IsOptional() @IsString() @MaxLength(2000)
  userNote?: string;

  @ApiPropertyOptional({
    example: '2026-11-07T06:30:00.000Z',
    description: 'شروع جلسه (ISO). در schema: startimetAt',
  })
  @IsOptional() @IsISO8601()
  startimetAt?: string;

  @ApiPropertyOptional({
    example: '2026-11-07T08:00:00.000Z',
    description: 'پایان جلسه (ISO). در schema: endtimeAt',
  })
  @IsOptional() @IsISO8601()
  endtimeAt?: string;
}

/**
 * date و userPlanId قابل ویرایش نیستند.
 * برای تغییر تاریخ: حذف + ثبت دوباره.
 */
export class UpdateUserLogDto extends PartialType(
  OmitType(CreateUserLogDto, ['date', 'userPlanId'] as const),
) {}

export class UpdateCoachNoteDto {
  @ApiProperty({ example: 'عالی بود' })
  @IsString() @MaxLength(2000)
  coachNote!: string;
}

// ---------- Stats / list query ----------

export class MonthlyStatsQueryDto {
  @ApiProperty({ example: 1405, description: 'سال شمسی' })
  @Type(() => Number) @IsInt() @Min(1300) @Max(1500)
  year!: number;
}

export class WeeklyStatsQueryDto {
  @ApiProperty({ example: '2026-09-01', description: 'شروع بازه (YYYY-MM-DD)' })
  @Matches(DATE_REGEX, { message: DATE_MESSAGE })
  from!: string;

  @ApiProperty({ example: '2026-11-07', description: 'پایان بازه — حداکثر ۳۶۵ روز' })
  @Matches(DATE_REGEX, { message: DATE_MESSAGE })
  to!: string;
}

export class YearlyStatsQueryDto {
  @ApiProperty({ example: 1405, description: 'سال شمسی — فقط همان یک سال' })
  @Type(() => Number) @IsInt() @Min(1300) @Max(1500)
  year!: number;
}

export enum LogSortBy {
  DATE_DESC = 'date_desc',
  DATE_ASC = 'date_asc',
  WEIGHT_DESC = 'weight_desc',
  WEIGHT_ASC = 'weight_asc',
  DONE_EX_DESC = 'done_exercises_desc',
  DONE_MEALS_DESC = 'done_meals_desc',
  CALORIES_DESC = 'calories_desc',
}

export class LogRangeQueryDto extends QueryDefaultDto {
  @ApiPropertyOptional({ example: '2026-01-01', description: 'شروع بازه (الزامی برای coach list با فیلتر)' })
  @IsOptional() @Matches(DATE_REGEX, { message: DATE_MESSAGE })
  from?: string;

  @ApiPropertyOptional({ example: '2026-11-07' })
  @IsOptional() @Matches(DATE_REGEX, { message: DATE_MESSAGE })
  to?: string;

  @ApiPropertyOptional({ enum: LogSortBy, default: LogSortBy.DATE_DESC })
  @IsOptional() @IsEnum(LogSortBy)
  sort?: LogSortBy;

  @ApiPropertyOptional({ description: 'فیلتر روی یک userPlan' })
  @IsOptional() @IsUUID('4')
  userPlanId?: string;
}
