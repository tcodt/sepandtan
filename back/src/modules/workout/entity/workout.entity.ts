import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkoutDayExerciseEntity {
  @ApiProperty({ example: '...' }) id!: string;
  @ApiProperty({ example: '...' }) dayId!: string;
  @ApiProperty({ example: '...' }) exerciseId!: string;
  @ApiProperty({ example: 1 }) order!: number;
  @ApiPropertyOptional({ example: 4, nullable: true }) sets?: number | null;
  @ApiPropertyOptional({ example: '10', nullable: true }) reps?: string | null;
  @ApiPropertyOptional({ example: 60, nullable: true }) durationSec?: number | null;
  @ApiPropertyOptional({ example: 90, nullable: true }) restSec?: number | null;
  @ApiPropertyOptional({ example: 'وزنه متوسط', nullable: true }) notes?: string | null;
  @ApiPropertyOptional({ description: 'اطلاعات حرکت' })
  exercise?: { id: string; title: string; slug: string; gif?: string | null; video?: string | null; level: string };
}

export class WorkoutDayEntity {
  @ApiProperty({ example: '...' }) id!: string;
  @ApiProperty({ example: '...' }) phaseId!: string;
  @ApiProperty({ enum: ['TEMPLATE', 'OVERRIDE'], example: 'TEMPLATE' }) type!: string;
  @ApiPropertyOptional({ example: 1, nullable: true, description: 'برای TEMPLATE (۱-۷)' }) weekday?: number | null;
  @ApiPropertyOptional({ example: '2026-11-14', nullable: true, description: 'برای OVERRIDE' }) date?: Date | null;
  @ApiPropertyOptional({ example: 'روز سینه', nullable: true }) title?: string | null;
  @ApiProperty({ example: false }) isRestDay!: boolean;
  @ApiPropertyOptional({ example: 'نکات', nullable: true }) notes?: string | null;
  @ApiPropertyOptional({ type: [WorkoutDayExerciseEntity] }) exercises?: WorkoutDayExerciseEntity[];
}

export class WorkoutPhaseEntity {
  @ApiProperty({ example: '...' }) id!: string;
  @ApiProperty({ example: '...' }) planId!: string;
  @ApiProperty({ example: 'هفته اول: آشنایی' }) title!: string;
  @ApiProperty({ example: 1 }) startWeek!: number;
  @ApiProperty({ example: 2 }) endWeek!: number;
  @ApiProperty({ example: 1 }) order!: number;
  @ApiPropertyOptional({ type: [WorkoutDayEntity] }) days?: WorkoutDayEntity[];
}

export class WorkoutPlanEntity {
  @ApiProperty({ example: '...' }) id!: string;
  @ApiPropertyOptional({ example: '...', nullable: true }) coachId?: string | null;
  @ApiPropertyOptional({ example: '...', nullable: true }) dietPlanId?: string | null;
  @ApiProperty({ type: [String], example: ['https://...'] }) coverImage!: string[];
  @ApiProperty({ example: 'برنامه حجم ۸ هفته‌ای' }) title!: string;
  @ApiPropertyOptional({ example: '...', nullable: true }) description?: string | null;
  @ApiProperty({ example: 500000 }) price!: number;
  @ApiPropertyOptional({ example: 400000, nullable: true }) discountPrice?: number | null;
  @ApiProperty({ example: false }) isPublished!: boolean;
  @ApiPropertyOptional({ example: 18, nullable: true }) minAge?: number | null;
  @ApiPropertyOptional({ example: 60, nullable: true }) maxAge?: number | null;
  @ApiPropertyOptional({ example: 'نکات', nullable: true }) note?: string | null;
  @ApiProperty({ example: 0 }) countRating!: number;
  @ApiProperty({ example: 0 }) totalRating!: number;
  @ApiProperty({ example: 4.5 }) avgRating!: number;
  @ApiPropertyOptional({ example: 8, nullable: true }) durationWeeks?: number | null;
  @ApiProperty({ enum: ['COACH', 'SITE', 'AI'], example: 'COACH' }) source!: string;
  @ApiPropertyOptional({ example: '...', nullable: true }) trainingGoalId?: string | null;
  @ApiPropertyOptional({ nullable: true }) activityLevel?: string | null;
  @ApiPropertyOptional({ nullable: true }) experienceLevel?: string | null;
  @ApiPropertyOptional({ nullable: true }) gender?: string | null;
  @ApiPropertyOptional({ nullable: true }) trainingLocation?: string | null;
  @ApiPropertyOptional({ example: 4, nullable: true }) trainingDaysPerWeek?: number | null;
  @ApiProperty({ type: [String], example: ['barbell'] }) requiredEquipment!: string[];
  @ApiPropertyOptional({ example: '2025-12-01T00:00:00.000Z', nullable: true }) discountExpired?: Date | null;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' }) updatedAt!: Date;
  @ApiPropertyOptional({ type: [WorkoutPhaseEntity] }) phases?: WorkoutPhaseEntity[];
}

export class WorkoutPlanSummaryEntity {
  @ApiProperty({ example: '...' }) id!: string;
  @ApiProperty({ example: 'برنامه حجم' }) title!: string;
  @ApiProperty({ type: [String], example: ['https://...'] }) coverImage!: string[];
  @ApiProperty({ example: 500000 }) price!: number;
  @ApiPropertyOptional({ example: 400000, nullable: true }) discountPrice?: number | null;
  @ApiProperty({ example: 4.5 }) avgRating!: number;
  @ApiProperty({ example: 10 }) countRating!: number;
  @ApiProperty({ example: true }) isPublished!: boolean;
  @ApiPropertyOptional({ example: 8, nullable: true }) durationWeeks?: number | null;
  @ApiPropertyOptional({ example: 4, nullable: true }) trainingDaysPerWeek?: number | null;
  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' }) createdAt!: Date;
}

export class TodayWorkoutEntity {
  @ApiProperty({ example: '2026-11-14' }) date!: string;
  @ApiProperty({ example: 3 }) weekNumber!: number;
  @ApiProperty({ type: WorkoutPhaseEntity }) phase!: WorkoutPhaseEntity;
  @ApiProperty({ type: WorkoutDayEntity }) day!: WorkoutDayEntity;
  @ApiProperty({ example: false, description: 'آیا Override بود؟' }) isOverride!: boolean;
}