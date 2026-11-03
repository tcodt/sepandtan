import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsBoolean, IsInt, IsNumber, IsArray,
  IsEnum, IsUUID, IsDateString, Min, MaxLength, ArrayMaxSize,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { MealType, PlanSource, Prioritytype } from '../../../generated/prisma/enums.js';

// ---------- Plan ----------
export class CreateDietPlanDto {
  @ApiProperty({ example: 'برنامه غذایی حجم' })
  @IsString() @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ example: 'برنامه ۸ هفته‌ای...' })
  @IsOptional() @IsString() @MaxLength(5000)
  description?: string;

  @ApiProperty({ type: [String], example: ['https://cdn.example.com/diet/cover.jpg'] })
  @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  coverImage!: string[];

  @ApiProperty({ example: 500000 })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 400000 })
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  discountPrice?: number;

  @ApiPropertyOptional({ enum: [...Object.values(PlanSource)], example: 'COACH' })
  @IsOptional() @IsEnum(PlanSource)
  source?: PlanSource;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsOptional() @IsUUID('4')
  trainingGoalId?: string;

  @ApiPropertyOptional({ example: 2500 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  targetCalories?: number;

  @ApiPropertyOptional({ example: 150 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  targetProteinG?: number;

  @ApiPropertyOptional({ example: 250 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  targetCarbsG?: number;

  @ApiPropertyOptional({ example: 70 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0)
  targetFatG?: number;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  durationWeeks?: number;

  @ApiPropertyOptional({ example: '2025-12-01T00:00:00.000Z' })
  @IsOptional() @IsDateString()
  discountExpired?: string;
}

export class UpdateDietPlanDto extends PartialType(CreateDietPlanDto) {}

// ---------- Day ----------
export class CreateDietDayDto {
  @ApiProperty({ example: 1 })
  @Type(() => Number) @IsInt() @Min(1)
  dayIndex!: number;

  @ApiPropertyOptional({ example: 'روز اول' })
  @IsOptional() @IsString() @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'نکات' })
  @IsOptional() @IsString() @MaxLength(1000)
  notes?: string;
}

export class UpdateDietDayDto extends PartialType(CreateDietDayDto) {}

// ---------- Meal ----------
export class CreateDietMealDto {
  @ApiProperty({ enum: [...Object.values(MealType)], example: 'BREAKFAST' })
  @IsEnum(MealType)
  type!: MealType;

  @ApiPropertyOptional({ enum: [...Object.values(Prioritytype)], example: 'PRIMARY' })
  @IsOptional() @IsEnum(Prioritytype)
  priority?: Prioritytype;

  @ApiProperty({ example: 1 })
  @Type(() => Number) @IsInt() @Min(0)
  order!: number;

  @ApiPropertyOptional({ example: 'قبل از تمرین' })
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}

export class UpdateDietMealDto extends PartialType(CreateDietMealDto) {}

// ---------- Meal Item ----------
export class CreateDietMealItemDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @IsUUID('4')
  foodId!: string;

  @ApiProperty({ example: 150 })
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  quantityGrams!: number;

  @ApiPropertyOptional({ example: 'پخته' })
  @IsOptional() @IsString() @MaxLength(500)
  notes?: string;
}

export class UpdateDietMealItemDto extends PartialType(CreateDietMealItemDto) {}