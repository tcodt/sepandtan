import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsDateString, IsNumber, IsArray,
  IsUUID, IsInt, IsObject, Min, MaxLength, ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';

// ---------- Create (بخش‌های ورزش/تغذیه/وزن همه اختیاری) ----------
export class CreateUserLogDto {
  @ApiProperty({ example: '2025-01-01', description: 'تاریخ (YYYY-MM-DD)' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ example: '...', description: 'userPlanId اختیاری' })
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

  @ApiPropertyOptional({ example: 2000 })
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

export class UpdateUserLogDto extends PartialType(CreateUserLogDto) {}

export class UpdateCoachNoteDto {
  @ApiProperty({ example: 'عالی بود' })
  @IsString() @MaxLength(2000)
  coachNote!: string;
}