import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsNumber,
  IsArray,
  IsEnum,
  IsUUID,
  IsDateString,
  Min,
  Max,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  PlanSource,
  ActivityLevel,
  ExperienceLevel,
  Gender,
  TrainingLocation,
} from '../../../generated/prisma/enums.js';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';

// ---------- Plan ----------

export enum SortOptionWorkoutPlan {
  OLDEST = 'oldest',
  NEWEST = 'newest',
  MORE_PRICE = 'more_price',
  LOW_PRICE = 'low_price',
  MORE_RATE = 'more_rate',
  LOW_RATE = 'low_rate',
}
export class CreateWorkoutPlanDto {
  @ApiProperty({ example: 'برنامه حجم ۸ هفته‌ای' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'برنامه تمرینی...' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({
    type: [String],
    example: ['https://cdn.example.com/workout/cover.jpg'],
  })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  coverImage!: string[];

  @ApiProperty({ example: 500000 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 400000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountPrice?: number;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minAge?: number;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxAge?: number;

  @ApiPropertyOptional({ example: 'نکات مهم' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  note?: string;

  @ApiPropertyOptional({
    example: 8,
    description: 'مدت برنامه به هفته؛ می‌تواند بیش از یک ماه باشد',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(104)
  durationWeeks?: number;

  @ApiPropertyOptional({
    enum: [...Object.values(PlanSource)],
    example: 'COACH',
  })
  @IsOptional()
  @IsEnum(PlanSource)
  source?: PlanSource;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsOptional()
  @IsUUID('4')
  trainingGoalId?: string;

  @ApiPropertyOptional({ enum: [...Object.values(ActivityLevel)] })
  @IsOptional()
  @IsEnum(ActivityLevel)
  activityLevel?: ActivityLevel;

  @ApiPropertyOptional({ enum: [...Object.values(ExperienceLevel)] })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  experienceLevel?: ExperienceLevel;

  @ApiPropertyOptional({ enum: [...Object.values(Gender)] })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ enum: [...Object.values(TrainingLocation)] })
  @IsOptional()
  @IsEnum(TrainingLocation)
  trainingLocation?: TrainingLocation;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  trainingDaysPerWeek?: number;

  @ApiPropertyOptional({
    description: 'آیدی رکورد ها تجهیزات (آرایه UUID)',
    type: [String],
    example: ['57635d56-30ab-4aae-8146-c24a2e50f3e0'],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    if (typeof value === 'string') return [value];
    return value;
  })
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('4', { each: true, message: 'هر آیتم باید یک UUID معتبر باشد' })
  equipmentIds?: string[];

  @ApiPropertyOptional({ example: '2025-12-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  discountExpired?: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsOptional()
  @IsUUID('4')
  dietPlanId?: string;
}

export class UpdateWorkoutPlanDto extends PartialType(CreateWorkoutPlanDto) { }

// ---------- Phase ----------
export class CreateWorkoutPhaseDto {
  @ApiProperty({ example: 'فاز پایه — هفته ۱ تا ۲' })
  @IsString()
  @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 1, description: 'شروع از هفته ۱' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(104)
  startWeek!: number;

  @ApiProperty({
    example: 2,
    description: 'می‌تواند تا durationWeeks+1 برود (حاشیه یک هفته)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(105)
  endWeek!: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'ترتیب نمایش؛ پیش‌فرض startWeek',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order?: number;
}

export class UpdateWorkoutPhaseDto extends PartialType(CreateWorkoutPhaseDto) { }

// ---------- Day ----------
export class CreateWorkoutDayDto {
  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'فاز والد — الزامی',
  })
  @IsUUID('4')
  workoutPhaseId!: string;

  @ApiProperty({
    example: 0,
    description: 'روز هفته: ۰=شنبه … ۶=جمعه (یا قرارداد خودت)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  weekday!: number;

  @ApiPropertyOptional({ example: 'سینه و پشت بازو' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isRestDay?: boolean;

  @ApiPropertyOptional({ example: 'قبل از تمرین ۵ دقیقه گرم کردن' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

export class UpdateWorkoutDayDto extends PartialType(CreateWorkoutDayDto) { }

// ---------- Exercise Item ----------
export class CreateWorkoutExerciseDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID('4')
  exerciseId!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  order!: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sets?: number;

  @ApiPropertyOptional({
    example: '10',
    description: '"10" یا "8-12" یا "تا ناتوانی"',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  reps?: string;

  @ApiPropertyOptional({ example: 60 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  durationSec?: number;

  @ApiPropertyOptional({ example: 90 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  restSec?: number;

  @ApiPropertyOptional({ example: 'با وزنه متوسط' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class UpdateWorkoutExerciseDto extends PartialType(CreateWorkoutExerciseDto) { }

export class SearchWorkOutCoach extends QueryDefaultDto {
  @ApiPropertyOptional({ description: 'نوع مرتب‌سازی', enum: SortOptionWorkoutPlan })
  @IsOptional()
  @IsEnum(SortOptionWorkoutPlan)
  sortBy?: SortOptionWorkoutPlan = SortOptionWorkoutPlan.NEWEST;

  @ApiPropertyOptional({ description: 'نوع جنسیت', enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

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

export class SearchWorkOutUser extends QueryDefaultDto {
  @ApiPropertyOptional({ description: 'نوع مرتب‌سازی', enum: SortOptionWorkoutPlan })
  @IsOptional()
  @IsEnum(SortOptionWorkoutPlan)
  sortBy?: SortOptionWorkoutPlan = SortOptionWorkoutPlan.NEWEST;

  @ApiPropertyOptional({ description: 'نوع جنسیت', enum: Gender })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ required: false, description: 'توی تایتل پلن جستجو میشه' })
  @IsOptional()
  @IsString()
  title?: string
}

export class SearchWorkOutAdmin extends SearchWorkOutCoach {
  @ApiPropertyOptional({ required: false, description: 'آیدی مربی' })
  @IsOptional()
  @IsString()
  coachId?: string

  @ApiPropertyOptional({ description: 'نوع پلن', enum: PlanSource })
  @IsOptional()
  @IsEnum(PlanSource)
  source?: PlanSource;
}