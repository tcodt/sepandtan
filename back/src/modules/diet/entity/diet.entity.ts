import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ---------- Meal Item ----------
export class DietMealItemEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  mealId!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  foodId!: string;

  @ApiProperty({ example: 150.0, description: 'گرم' })
  quantityGrams!: number;

  @ApiPropertyOptional({ example: 'پخته', nullable: true })
  notes?: string | null;

  @ApiPropertyOptional({  description: 'اطلاعات غذا (در صورت include)' })
  food?: {
    id: string;
    name: string;
    caloriesPer100g: number;
    proteinPer100g: number;
    carbsPer100g: number;
    fatPer100g: number;
  };
}

// ---------- Meal ----------
export class DietMealEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  dayId!: string;

  @ApiProperty({ enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'], example: 'BREAKFAST' })
  type!: string;

  @ApiProperty({ enum: ['PRIMARY', 'SECONDARY', 'TERTIARY'], example: 'PRIMARY' })
  priority!: string;

  @ApiProperty({ example: 1 })
  order!: number;

  @ApiPropertyOptional({ example: 'قبل از تمرین', nullable: true })
  notes?: string | null;

  @ApiPropertyOptional({ type: [DietMealItemEntity] })
  items?: DietMealItemEntity[];
}

// ---------- Day ----------
export class DietDayEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  planId!: string;

  @ApiProperty({ example: 1, description: 'روز چندم برنامه' })
  weekday!: number;

  @ApiPropertyOptional({ example: 'روز اول', nullable: true })
  title?: string | null;

  @ApiPropertyOptional({ example: 'نکات روز', nullable: true })
  notes?: string | null;

  @ApiPropertyOptional({ type: [DietMealEntity] })
  meals?: DietMealEntity[];
}

// ---------- Plan ----------
export class DietPlanEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', nullable: true })
  coachId?: string | null;

  @ApiProperty({ type: [String], example: ['https://cdn.example.com/diet/cover.jpg'] })
  coverImage!: string[];

  @ApiProperty({ example: 'برنامه غذایی حجم' })
  title!: string;

  @ApiPropertyOptional({ example: 'برنامه ۸ هفته‌ای...', nullable: true })
  description?: string | null;

  @ApiProperty({ example: 500000 })
  price!: number;

  @ApiPropertyOptional({ example: 400000, nullable: true })
  discountPrice?: number | null;

  @ApiProperty({ example: 0 })
  countRating!: number;

  @ApiProperty({ example: 0 })
  totalRating!: number;

  @ApiProperty({ example: 4.5 })
  avgRating!: number;

  @ApiProperty({ example: false })
  isPublished!: boolean;

  @ApiProperty({ enum: ['COACH', 'SITE', 'AI'], example: 'COACH' })
  source!: string;

  @ApiPropertyOptional({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', nullable: true })
  trainingGoalId?: string | null;

  @ApiPropertyOptional({ example: 2500, nullable: true })
  targetCalories?: number | null;

  @ApiPropertyOptional({ example: 150, nullable: true })
  targetProteinG?: number | null;

  @ApiPropertyOptional({ example: 250, nullable: true })
  targetCarbsG?: number | null;

  @ApiPropertyOptional({ example: 70, nullable: true })
  targetFatG?: number | null;

  @ApiPropertyOptional({ example: 8, nullable: true })
  durationWeeks?: number | null;

  @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z', nullable: true })
  discountExpired?: Date | null;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt!: Date;

  @ApiPropertyOptional({ type: [DietDayEntity] })
  days?: DietDayEntity[];
}

// ---------- Summary (لیست) ----------
export class DietPlanSummaryEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: 'برنامه غذایی حجم' })
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

  @ApiPropertyOptional({ example: 2500, nullable: true })
  targetCalories?: number | null;

  @ApiPropertyOptional({ example: 8, nullable: true })
  durationWeeks?: number | null;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: Date;
}