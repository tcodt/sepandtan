import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserLogEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiPropertyOptional({ nullable: true })
  userPlanId?: string | null;

  @ApiProperty({ example: '2026-11-07', description: 'روز تقویمی تهران (Date column)' })
  date!: Date;

  @ApiProperty({ example: 1405 })
  jalaliYear!: number;

  @ApiProperty({ example: 8 })
  jalaliMonth!: number;

  @ApiPropertyOptional({ example: 75.5, nullable: true, description: 'Decimal → ممکن است string برگردد' })
  weightKg?: number | string | null;

  // ورزش
  @ApiProperty({ type: [String], description: 'تمرین‌های انجام‌نشده' })
  unCompletedExerciseIds!: string[];

  @ApiProperty({ example: 5 })
  plannedExercises!: number;

  @ApiProperty({ example: 3 })
  doneExercises!: number;

  @ApiProperty({ type: 'array' })
  extraExercises!: unknown[];

  @ApiPropertyOptional({ nullable: true })
  caloriesBurned?: number | null;

  // تغذیه
  @ApiProperty({ type: [String], description: 'وعده‌های انجام‌نشده' })
  unCompletedMealIds!: string[];

  @ApiProperty({ example: 3 })
  plannedMeals!: number;

  @ApiProperty({ example: 2 })
  doneMeals!: number;

  @ApiProperty({ type: 'array' })
  extraMeals!: unknown[];

  @ApiPropertyOptional({ nullable: true })
  caloriesPlanned?: number | null;

  @ApiPropertyOptional({ nullable: true })
  caloriesConsumed?: number | null;

  @ApiPropertyOptional({ nullable: true })
  proteinG?: number | null;

  @ApiPropertyOptional({ nullable: true })
  carbsG?: number | null;

  @ApiPropertyOptional({ nullable: true })
  fatG?: number | null;

  @ApiPropertyOptional({ nullable: true })
  userNote?: string | null;

  @ApiPropertyOptional({ nullable: true })
  coachNote?: string | null;

  @ApiPropertyOptional({ description: 'شروع جلسه (schema: startimetAt)' })
  startimetAt?: Date;

  @ApiPropertyOptional({ description: 'پایان جلسه (schema: endtimeAt)' })
  endtimeAt?: Date;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class UserLogSummaryEntity {
  @ApiProperty() id!: string;
  @ApiProperty() date!: Date;
  @ApiPropertyOptional({ nullable: true }) weightKg?: number | string | null;
  @ApiProperty() doneExercises!: number;
  @ApiProperty() plannedExercises!: number;
  @ApiProperty() doneMeals!: number;
  @ApiProperty() plannedMeals!: number;
  @ApiPropertyOptional({ nullable: true }) caloriesConsumed?: number | null;
  @ApiPropertyOptional({ nullable: true }) userPlanId?: string | null;
}

class LogStatBase {
  @ApiProperty({ example: 24 }) loggedDays!: number;
  @ApiPropertyOptional({ nullable: true }) avgWeightKg!: number | null;
  @ApiPropertyOptional({ nullable: true }) lastWeightKg!: number | null;
  @ApiProperty() caloriesBurned!: number;
  @ApiPropertyOptional({ nullable: true }) avgCaloriesConsumed!: number | null;
  @ApiProperty() doneExercises!: number;
  @ApiProperty() plannedExercises!: number;
  @ApiPropertyOptional({ nullable: true }) workoutCompletion!: number | null;
  @ApiProperty() doneMeals!: number;
  @ApiProperty() plannedMeals!: number;
  @ApiPropertyOptional({ nullable: true }) mealCompletion!: number | null;
}

export class MonthlyStatEntity extends LogStatBase {
  @ApiProperty({ example: 8 }) month!: number;
}

export class WeeklyStatEntity extends LogStatBase {
  @ApiProperty({ example: '2026-11-01' }) weekStart!: string;
}

export class YearlyStatEntity extends LogStatBase {
  @ApiProperty({ example: 1405 }) year!: number;
}

export class MonthlyStatsResponseEntity {
  @ApiProperty() year!: number;
  @ApiProperty({ type: [MonthlyStatEntity] }) months!: MonthlyStatEntity[];
}

export class WeeklyStatsResponseEntity {
  @ApiProperty() from!: string;
  @ApiProperty() to!: string;
  @ApiProperty({ type: [WeeklyStatEntity] }) weeks!: WeeklyStatEntity[];
}

export class YearlyStatsResponseEntity {
  @ApiProperty({ type: YearlyStatEntity }) year!: YearlyStatEntity;
}
