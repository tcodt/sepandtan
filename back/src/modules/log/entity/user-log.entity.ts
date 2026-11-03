import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserLogEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '...' })
  userId!: string;

  @ApiPropertyOptional({ example: '...', nullable: true })
  userPlanId?: string | null;

  @ApiProperty({ example: '2025-01-01', description: 'تاریخ (Asia/Tehran)' })
  date!: Date;

  @ApiPropertyOptional({ example: 75.5, nullable: true })
  weightKg?: number | null;

  // ورزش
  @ApiProperty({ type: [String], example: [] })
  plannedExerciseIds!: string[];

  @ApiProperty({ type: [String], example: [] })
  doneExerciseIds!: string[];

  @ApiProperty({ example: 5 })
  plannedExercises!: number;

  @ApiProperty({ example: 3 })
  doneExercises!: number;

  @ApiProperty({ type: 'array', example: [{ name: 'دویدن', durationMin: 20, caloriesBurned: 200, note: '' }] })
  extraExercises!: any[];

  @ApiPropertyOptional({ example: 200, nullable: true })
  caloriesBurned?: number | null;

  // تغذیه
  @ApiProperty({ type: [String], example: [] })
  plannedMealIds!: string[];

  @ApiProperty({ type: [String], example: [] })
  doneMealIds!: string[];

  @ApiProperty({ example: 3 })
  plannedMeals!: number;

  @ApiProperty({ example: 2 })
  doneMeals!: number;

  @ApiProperty({ type: 'array', example: [{ name: 'سیب', calories: 95, proteinG: 0, carbsG: 25, fatG: 0 }] })
  extraMeals!: any[];

  @ApiPropertyOptional({ example: 2000, nullable: true })
  caloriesPlanned?: number | null;

  @ApiPropertyOptional({ example: 1800, nullable: true })
  caloriesConsumed?: number | null;

  @ApiPropertyOptional({ example: 120, nullable: true })
  proteinG?: number | null;

  @ApiPropertyOptional({ example: 200, nullable: true })
  carbsG?: number | null;

  @ApiPropertyOptional({ example: 60, nullable: true })
  fatG?: number | null;

  @ApiPropertyOptional({ example: 'احساس خوبی داشتم', nullable: true })
  userNote?: string | null;

  @ApiPropertyOptional({ example: 'عالی', nullable: true })
  coachNote?: string | null;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}

export class UserLogSummaryEntity {
  @ApiProperty({ example: '...' }) id!: string;
  @ApiProperty({ example: '2025-01-01' }) date!: Date;
  @ApiPropertyOptional({ example: 75.5, nullable: true }) weightKg?: number | null;
  @ApiProperty({ example: 3 }) doneExercises!: number;
  @ApiProperty({ example: 5 }) plannedExercises!: number;
  @ApiProperty({ example: 2 }) doneMeals!: number;
  @ApiProperty({ example: 3 }) plannedMeals!: number;
  @ApiPropertyOptional({ example: 1800, nullable: true }) caloriesConsumed?: number | null;
}