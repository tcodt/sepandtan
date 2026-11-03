import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString, IsOptional, IsEnum, IsUUID, IsArray,
  IsNumber, IsDateString, MaxLength, Min, ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PlanType, PlanSource, PlanRequestStatus } from '../../../generated/prisma/enums.js';

// ---------- PlanRequest ----------
export class CreatePlanRequestDto {
  @ApiProperty({ example: '...' }) @IsUUID('4') coachId!: string;
  @ApiPropertyOptional({ example: '...' }) @IsOptional() @IsUUID('4') workoutTemplateId?: string;
  @ApiPropertyOptional({ example: '...' }) @IsOptional() @IsUUID('4') dietTemplateId?: string;
  @ApiPropertyOptional({ type: [String], example: [] })
  @IsOptional() @IsArray() @ArrayMaxSize(10) @IsString({ each: true })
  images?: string[];
  @ApiPropertyOptional({ example: 'درخواست برنامه حجم' })
  @IsOptional() @IsString() @MaxLength(2000)
  note?: string;
}

export class UpdatePlanRequestStatusDto {
  @ApiProperty({ enum: [...Object.values(PlanRequestStatus)], example: 'ACCEPTED' })
  @IsEnum(PlanRequestStatus)
  status!: PlanRequestStatus;

  @ApiPropertyOptional({ example: 'دلیل رد' })
  @IsOptional() @IsString() @MaxLength(1000)
  rejectionReason?: string;
}

// ---------- UserPlan ----------
export class CreateUserPlanDto {
  @ApiProperty({ example: 'برنامه من' })
  @IsString() @MaxLength(200)
  title!: string;

  @ApiProperty({ enum: [...Object.values(PlanType)], example: 'WORKOUT' })
  @IsEnum(PlanType)
  type!: PlanType;

  @ApiPropertyOptional({ enum: [...Object.values(PlanSource)], example: 'COACH' })
  @IsOptional() @IsEnum(PlanSource)
  source?: PlanSource;

  @ApiPropertyOptional({ example: '...' }) @IsOptional() @IsUUID('4') workoutPlanId?: string;
  @ApiPropertyOptional({ example: '...' }) @IsOptional() @IsUUID('4') dietPlanId?: string;
  @ApiPropertyOptional({ example: '...' }) @IsOptional() @IsUUID('4') requestId?: string;
}

export class UpdateUserPlanDto extends PartialType(CreateUserPlanDto) {}

export class CustomizeSnapshotDto {
  @ApiPropertyOptional({  description: 'snapshot تمرین (JSON)' })
  @IsOptional() snapshotExercise?: Record<string, any>;

  @ApiPropertyOptional({  description: 'snapshot غذا (JSON)' })
  @IsOptional() snapshotDiet?: Record<string, any>;
}