import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsInt, IsNumber, IsArray, IsEnum, IsUUID, IsBoolean,
  Min, Max, MaxLength, ArrayMaxSize, ArrayMinSize, ValidateNested, Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';
import { MealType, PlanStatus, Prioritytype } from '../../../generated/prisma/enums.js';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'تاریخ باید به فرمت YYYY-MM-DD باشد';

// ═════════ ورودی ویرایش snapshot ورزشی ═════════
// فقط id و پارامترها را بفرست؛ title/cover حرکت را سرور از دیتابیس پر می‌کند.

export class SnapshotExerciseInputDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID('4')
  exerciseId!: string;

  @ApiProperty({ example: 1, description: 'ترتیب در روز (سرور بر اساس آن مرتب و شماره‌گذاری مجدد می‌کند)' })
  @Type(() => Number) @IsInt() @Min(0) @Max(100)
  order!: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100)
  sets?: number;

  @ApiPropertyOptional({ example: '8-10' })
  @IsOptional() @IsString() @MaxLength(50)
  reps?: string;

  @ApiPropertyOptional({ example: 45 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(7200)
  durationSec?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(3600)
  restSec?: number;

  @ApiPropertyOptional({ example: 'با وزنه‌ی سبک‌تر' })
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}

export class SnapshotWorkoutDayInputDto {
  @ApiProperty({ example: 0, description: '۰=شنبه … ۶=جمعه؛ در هر فاز یکتا' })
  @Type(() => Number) @IsInt() @Min(0) @Max(6)
  weekday!: number;

  @ApiPropertyOptional({ example: 'سینه و سه‌سر' })
  @IsOptional() @IsString() @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional() @IsBoolean()
  isRestDay?: boolean;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;

  @ApiProperty({ type: [SnapshotExerciseInputDto], description: 'حداکثر ۳۰ حرکت در روز' })
  @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => SnapshotExerciseInputDto)
  exercises!: SnapshotExerciseInputDto[];
}

export class SnapshotWorkoutPhaseInputDto {
  @ApiProperty({ example: 'فاز ۱' })
  @IsString() @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number) @IsInt() @Min(1) @Max(104)
  startWeek!: number;

  @ApiProperty({ example: 4 })
  @Type(() => Number) @IsInt() @Min(1) @Max(105)
  endWeek!: number;

  @ApiProperty({ type: [SnapshotWorkoutDayInputDto], description: 'حداکثر ۷ روز' })
  @IsArray() @ArrayMaxSize(7) @ValidateNested({ each: true }) @Type(() => SnapshotWorkoutDayInputDto)
  days!: SnapshotWorkoutDayInputDto[];
}

export class WorkoutSnapshotInputDto {
  @ApiProperty({ type: [SnapshotWorkoutPhaseInputDto], description: 'فازها نباید هم‌پوشانی داشته باشند' })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(52) @ValidateNested({ each: true }) @Type(() => SnapshotWorkoutPhaseInputDto)
  phases!: SnapshotWorkoutPhaseInputDto[];
}

// ═════════ ورودی ویرایش snapshot غذایی ═════════

export class SnapshotMealItemInputDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID('4')
  foodId!: string;

  @ApiProperty({ example: 150, description: 'گرم (۰.۰۱ تا ۹۹۹۹)؛ کالری و ماکرو را سرور حساب می‌کند' })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(9999)
  quantityGrams!: number;

  @ApiPropertyOptional({ example: 'پخته' })
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}

export class SnapshotMealInputDto {
  @ApiPropertyOptional({ description: 'برای وعده‌ی موجود همان id قبلی را بفرست تا logهای کاربر معتبر بماند؛ برای وعده‌ی جدید نفرست' })
  @IsOptional() @IsUUID('4')
  id?: string;

  @ApiProperty({ enum: [...Object.values(MealType)], example: 'BREAKFAST' })
  @IsEnum(MealType)
  type!: MealType;

  @ApiPropertyOptional({ enum: [...Object.values(Prioritytype)], example: 'PRIMARY' })
  @IsOptional() @IsEnum(Prioritytype)
  priority?: Prioritytype;

  @ApiProperty({ example: 1 })
  @Type(() => Number) @IsInt() @Min(0) @Max(100)
  order!: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;

  @ApiProperty({ type: [SnapshotMealItemInputDto], description: 'حداکثر ۲۰ آیتم در وعده' })
  @IsArray() @ArrayMaxSize(20) @ValidateNested({ each: true }) @Type(() => SnapshotMealItemInputDto)
  items!: SnapshotMealItemInputDto[];
}

export class SnapshotDietDayInputDto {
  @ApiProperty({ example: 0, description: '۰=شنبه … ۶=جمعه؛ در هر فاز یکتا' })
  @Type(() => Number) @IsInt() @Min(0) @Max(6)
  weekday!: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;

  @ApiProperty({ type: [SnapshotMealInputDto], description: 'حداکثر ۱۲ وعده در روز' })
  @IsArray() @ArrayMaxSize(12) @ValidateNested({ each: true }) @Type(() => SnapshotMealInputDto)
  meals!: SnapshotMealInputDto[];
}

export class SnapshotDietPhaseInputDto {
  @ApiProperty({ example: 'فاز کات' })
  @IsString() @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number) @IsInt() @Min(1) @Max(104)
  startWeek!: number;

  @ApiProperty({ example: 4 })
  @Type(() => Number) @IsInt() @Min(1) @Max(105)
  endWeek!: number;

  @ApiPropertyOptional({ example: 2200, description: 'اگر نباشد از هدف کل برنامه استفاده می‌شود' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(20000)
  targetCalories?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2000)
  targetProteinG?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2000)
  targetCarbsG?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2000)
  targetFatG?: number;

  @ApiProperty({ type: [SnapshotDietDayInputDto], description: 'حداکثر ۷ روز' })
  @IsArray() @ArrayMaxSize(7) @ValidateNested({ each: true }) @Type(() => SnapshotDietDayInputDto)
  days!: SnapshotDietDayInputDto[];
}

export class DietSnapshotInputDto {
  @ApiPropertyOptional({ example: 2500 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(20000)
  targetCalories?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2000)
  targetProteinG?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2000)
  targetCarbsG?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(2000)
  targetFatG?: number;

  @ApiProperty({ type: [SnapshotDietPhaseInputDto], description: 'فازها نباید هم‌پوشانی داشته باشند' })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(52) @ValidateNested({ each: true }) @Type(() => SnapshotDietPhaseInputDto)
  phases!: SnapshotDietPhaseInputDto[];
}

export class UpdateUserPlanSnapshotDto {
  @ApiPropertyOptional({ type: WorkoutSnapshotInputDto, description: 'جایگزینی کامل snapshot ورزشی (فقط اگر پلن بخش ورزشی دارد)' })
  @IsOptional() @ValidateNested() @Type(() => WorkoutSnapshotInputDto)
  workout?: WorkoutSnapshotInputDto;

  @ApiPropertyOptional({ type: DietSnapshotInputDto, description: 'جایگزینی کامل snapshot غذایی (فقط اگر پلن بخش غذایی دارد)' })
  @IsOptional() @ValidateNested() @Type(() => DietSnapshotInputDto)
  diet?: DietSnapshotInputDto;
}

// ═════════ فعال‌سازی و Queryها ═════════

export class ActivateUserPlanDto {
  @ApiPropertyOptional({
    example: '2026-11-10',
    description: 'تاریخ شروع (میلادی، به وقت تهران). پیش‌فرض امروز؛ نباید گذشته یا بیش از ۶۰ روز بعد باشد',
  })
  @IsOptional() @Matches(DATE_REGEX, { message: DATE_MESSAGE })
  startDate?: string;
}

export class TodayQueryDto {
  @ApiPropertyOptional({ example: '2026-11-09', description: 'تاریخ (YYYY-MM-DD)؛ پیش‌فرض امروز به وقت تهران' })
  @IsOptional() @Matches(DATE_REGEX, { message: DATE_MESSAGE })
  date?: string;
}

export class PartQueryDto {
  @ApiPropertyOptional({ example: 3, description: 'شماره‌ی هفته‌ی برنامه؛ فازی که این هفته را پوشش می‌دهد برمی‌گردد. پیش‌فرض هفته‌ی جاری' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(105)
  week?: number;
}

export class UserPlanQueryDto extends QueryDefaultDto {
  @ApiPropertyOptional({ enum: [...Object.values(PlanStatus)], description: 'فیلتر وضعیت' })
  @IsOptional() @IsEnum(PlanStatus)
  status?: PlanStatus;
}
