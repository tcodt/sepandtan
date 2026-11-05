import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsInt, IsNumber, IsArray,
  IsEnum, IsUUID, IsDateString, Min, Max, MaxLength, ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MealType, PlanSource, Prioritytype } from '../../../generated/prisma/enums.js';

// ---------- Plan ----------
export class CreateDietPlanDto {
  @ApiProperty({ example: 'برنامه غذایی حجم ۸ هفته' })
  @IsString() @MaxLength(200)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(5000)
  description?: string;

  @ApiProperty({ type: [String] })
  @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  coverImage!: string[];

  @ApiProperty({ example: 500000 })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  price!: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  discountPrice?: number;

  @ApiPropertyOptional({ enum: [...Object.values(PlanSource)] })
  @IsOptional() @IsEnum(PlanSource)
  source?: PlanSource;

  @ApiPropertyOptional()
  @IsOptional() @IsUUID('4')
  trainingGoalId?: string;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  targetCalories?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  targetProteinG?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  targetCarbsG?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  targetFatG?: number;

  @ApiPropertyOptional({ example: 8, description: 'می‌تواند بیش از یک ماه باشد' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(104)
  durationWeeks?: number;

  @ApiPropertyOptional()
  @IsOptional() @IsDateString()
  discountExpired?: string;
}

export class UpdateDietPlanDto extends PartialType(CreateDietPlanDto) {}

// ---------- Phase ----------
export class CreateDietPhaseDto {
  @ApiProperty({ example: 'فاز کات — هفته ۱ تا ۴' })
  @IsString() @MaxLength(200)
  title!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number) @IsInt() @Min(1) @Max(104)
  startWeek!: number;

  @ApiProperty({ example: 4 })
  @Type(() => Number) @IsInt() @Min(1) @Max(105)
  endWeek!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  order?: number;

  @ApiPropertyOptional({ example: 2200 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  targetCalories?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  targetProteinG?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  targetCarbsG?: number;

  @ApiPropertyOptional()
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  targetFatG?: number;
}

export class UpdateDietPhaseDto extends PartialType(CreateDietPhaseDto) {}

// ---------- Day ----------
export class CreateDietDayDto {
  @ApiProperty({ description: 'فاز والد — الزامی' })
  @IsUUID('4')
  dietPhaseId!: string;

  @ApiProperty({ example: 0, description: '۰=شنبه … ۶=جمعه' })
  @Type(() => Number) @IsInt() @Min(0) @Max(6)
  weekday!: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}

export class UpdateDietDayDto extends PartialType(CreateDietDayDto) {}

// ---------- Meal ----------
export class CreateDietMealDto {
  @ApiProperty({ enum: [...Object.values(MealType)] })
  @IsEnum(MealType)
  type!: MealType;

  @ApiPropertyOptional({ enum: [...Object.values(Prioritytype)] })
  @IsOptional() @IsEnum(Prioritytype)
  priority?: Prioritytype;

  @ApiProperty({ example: 1 })
  @Type(() => Number) @IsInt() @Min(0)
  order!: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}

export class UpdateDietMealDto extends PartialType(CreateDietMealDto) {}

// ---------- Meal Item ----------
export class CreateDietMealItemDto {
  @ApiProperty()
  @IsUUID('4')
  foodId!: string;

  @ApiProperty({ example: 150 })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  quantityGrams!: number;

  @ApiPropertyOptional()
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}

export class UpdateDietMealItemDto extends PartialType(CreateDietMealItemDto) {}