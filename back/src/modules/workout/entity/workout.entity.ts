import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkoutDayExerciseEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  dayId!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  exerciseId!: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiPropertyOptional({ example: 4, nullable: true })
  sets?: number | null;

  @ApiPropertyOptional({ example: '10', nullable: true, description: '"10" یا "8-12" یا "تا ناتوانی"' })
  reps?: string | null;

  @ApiPropertyOptional({ example: 60, nullable: true })
  durationSec?: number | null;

  @ApiPropertyOptional({ example: 90, nullable: true })
  restSec?: number | null;

  @ApiPropertyOptional({ example: 'با وزنه متوسط', nullable: true })
  notes?: string | null;

  @ApiPropertyOptional({ description: 'اطلاعات حرکت (در صورت include)' })
  exercise?: {
    id: string;
    title: string;
    slug: string;
    gif?: string | null;
    video?: string | null;
    level: string;
  };
}

export class WorkoutDayEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  planId!: string;

  @ApiProperty({ example: 1, description: 'روز چندم برنامه' })
  dayIndex!: number;

  @ApiPropertyOptional({ example: 'روز سینه و سه‌سر', nullable: true })
  title?: string | null;

  @ApiProperty({ example: false, description: 'روز استراحت' })
  isRestDay!: boolean;

  @ApiPropertyOptional({ example: 'نکات روز', nullable: true })
  notes?: string | null;

  @ApiPropertyOptional({ type: [WorkoutDayExerciseEntity] })
  exercises?: WorkoutDayExerciseEntity[];
}

export class WorkoutPlanEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', nullable: true })
  coachId?: string | null;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', nullable: true })
  dietPlanId?: string | null;

  @ApiProperty({ type: [String], example: ['https://cdn.example.com/workout/cover.jpg'] })
  coverImage!: string[];

  @ApiProperty({ example: 'برنامه حجم ۸ هفته‌ای' })
  title!: string;

  @ApiPropertyOptional({ example: 'برنامه تمرینی...', nullable: true })
  description?: string | null;

  @ApiProperty({ example: 500000 })
  price!: number;

  @ApiPropertyOptional({ example: 400000, nullable: true })
  discountPrice?: number | null;

  @ApiProperty({ example: false })
  isPublished!: boolean;

  @ApiPropertyOptional({ example: 18, nullable: true })
  minAge?: number | null;

  @ApiPropertyOptional({ example: 60, nullable: true })
  maxAge?: number | null;

  @ApiPropertyOptional({ example: 'نکات مهم', nullable: true })
  note?: string | null;

  @ApiProperty({ example: 0 })
  countRating!: number;

  @ApiProperty({ example: 0 })
  totalRating!: number;

  @ApiProperty({ example: 4.5 })
  avgRating!: number;

  @ApiPropertyOptional({ example: 8, nullable: true })
  durationWeeks?: number | null;

  @ApiProperty({ enum: ['COACH', 'SITE', 'AI'], example: 'COACH' })
  source!: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', nullable: true })
  trainingGoalId?: string | null;

  @ApiPropertyOptional({ enum: ['SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE'], nullable: true })
  activityLevel?: string | null;

  @ApiPropertyOptional({ enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], nullable: true })
  experienceLevel?: string | null;

  @ApiPropertyOptional({ enum: ['MALE', 'FEMALE', 'OTHER'], nullable: true })
  gender?: string | null;

  @ApiPropertyOptional({ enum: ['HOME', 'GYM', 'BOTH'], nullable: true })
  trainingLocation?: string | null;

  @ApiPropertyOptional({ example: 4, nullable: true })
  trainingDaysPerWeek?: number | null;

  @ApiProperty({ type: [String], example: ['barbell', 'bench'] })
  requiredEquipment!: string[];

  @ApiPropertyOptional({ example: '2025-12-01T00:00:00.000Z', nullable: true })
  discountExpired?: Date | null;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: [WorkoutDayEntity] })
  days?: WorkoutDayEntity[];
}

export class WorkoutPlanSummaryEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: 'برنامه حجم ۸ هفته‌ای' })
  title!: string;

  @ApiProperty({ type: [String], example: ['https://...'] })
  coverImage!: string[];

  @ApiProperty({ example: 500000 })
  price!: number;

  @ApiPropertyOptional({ example: 400000, nullable: true })
  discountPrice?: number | null;

  @ApiProperty({ example: 4.5 })
  avgRating!: number;

  @ApiProperty({ example: 10 })
  countRating!: number;

  @ApiProperty({ example: true })
  isPublished!: boolean;

  @ApiPropertyOptional({ example: 8, nullable: true })
  durationWeeks?: number | null;

  @ApiPropertyOptional({ example: 4, nullable: true })
  trainingDaysPerWeek?: number | null;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: Date;
}