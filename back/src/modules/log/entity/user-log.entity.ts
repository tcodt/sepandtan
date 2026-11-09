import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserLogEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  userId!: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', nullable: true })
  userPlanId?: string | null;

  @ApiProperty({ example: '2026-11-07', description: 'تاریخ میلادی (روز به وقت Asia/Tehran)' })
  date!: Date;

  @ApiProperty({ example: 1405, description: 'سال شمسی (از date محاسبه می‌شود)' })
  jalaliYear!: number;

  @ApiProperty({ example: 8, description: 'ماه شمسی ۱ تا ۱۲ (آبان = ۸)' })
  jalaliMonth!: number;

  /** توجه: Decimal در Prisma هنگام JSON شدن به string تبدیل می‌شود ("75.50") */
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

  @ApiProperty({ example: '2026-11-07T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-11-07T00:00:00.000Z' })
  updatedAt!: Date;
}

export class UserLogSummaryEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' }) id!: string;
  @ApiProperty({ example: '2026-11-07' }) date!: Date;
  @ApiPropertyOptional({ example: 75.5, nullable: true }) weightKg?: number | null;
  @ApiProperty({ example: 3 }) doneExercises!: number;
  @ApiProperty({ example: 5 }) plannedExercises!: number;
  @ApiProperty({ example: 2 }) doneMeals!: number;
  @ApiProperty({ example: 3 }) plannedMeals!: number;
  @ApiPropertyOptional({ example: 1800, nullable: true }) caloriesConsumed?: number | null;
}

// ---------- Stats ----------
class LogStatBase {
  @ApiProperty({ example: 24, description: 'تعداد روزهایی که لاگ ثبت شده' })
  loggedDays!: number;

  @ApiPropertyOptional({ example: 75.8, nullable: true, description: 'میانگین وزن (روزهای بدون وزن نادیده گرفته می‌شوند)' })
  avgWeightKg!: number | null;

  @ApiPropertyOptional({ example: 75.2, nullable: true, description: 'آخرین وزن ثبت‌شده در بازه' })
  lastWeightKg!: number | null;

  @ApiProperty({ example: 4200, description: 'جمع کالری سوزانده‌شده' })
  caloriesBurned!: number;

  @ApiPropertyOptional({ example: 1900, nullable: true, description: 'میانگین روزانه کالری مصرفی' })
  avgCaloriesConsumed!: number | null;

  @ApiProperty({ example: 40 }) doneExercises!: number;
  @ApiProperty({ example: 50 }) plannedExercises!: number;

  @ApiPropertyOptional({ example: 0.8, nullable: true, description: 'sum(done)/sum(planned) — null اگر برنامه‌ای نبوده' })
  workoutCompletion!: number | null;

  @ApiProperty({ example: 60 }) doneMeals!: number;
  @ApiProperty({ example: 72 }) plannedMeals!: number;

  @ApiPropertyOptional({ example: 0.83, nullable: true })
  mealCompletion!: number | null;
}

export class MonthlyStatEntity extends LogStatBase {
  @ApiProperty({ example: 8, description: 'ماه شمسی (۱ تا ۱۲)' })
  month!: number;
}

export class WeeklyStatEntity extends LogStatBase {
  @ApiProperty({ example: '2026-11-07', description: 'شنبه‌ی شروع هفته (میلادی)' })
  weekStart!: string;
}

export class MonthlyStatsResponseEntity {
  @ApiProperty({ example: 1405 }) year!: number;
  @ApiProperty({ type: [MonthlyStatEntity], description: 'فقط ماه‌هایی که لاگ دارند' })
  months!: MonthlyStatEntity[];
}

export class WeeklyStatsResponseEntity {
  @ApiProperty({ example: '2026-09-01' }) from!: string;
  @ApiProperty({ example: '2026-11-07' }) to!: string;
  @ApiProperty({ type: [WeeklyStatEntity], description: 'هفته‌ی اول و آخر ممکن است ناقص باشند' })
  weeks!: WeeklyStatEntity[];
}
