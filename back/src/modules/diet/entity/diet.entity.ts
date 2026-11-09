import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';

// ============ مقادیر محاسبه‌شده ============
export class NutritionEntity {
  @ApiProperty({ example: 520, description: 'کالری (kcal)' })
  calories!: number;

  @ApiProperty({ example: 38.5, description: 'پروتئین (گرم)' })
  proteinG!: number;

  @ApiProperty({ example: 60, description: 'کربوهیدرات (گرم)' })
  carbsG!: number;

  @ApiProperty({ example: 12.5, description: 'چربی (گرم)' })
  fatG!: number;
}

// ============ جزئیات (داخل GET plan) ============
export class DietFoodEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: 'سینه مرغ' }) name!: string;
  @ApiProperty({ example: 165, description: 'کالری در ۱۰۰ گرم' }) caloriesPer100g!: number;
  @ApiProperty({ example: 31 }) proteinPer100g!: number;
  @ApiProperty({ example: 0 }) carbsPer100g!: number;
  @ApiProperty({ example: 3.6 }) fatPer100g!: number;

  @ApiPropertyOptional({ example: true, description: 'فقط در نمای مربی (plan/my/:id). اگر false باشد غذا غیرفعال شده و باید جایگزین شود' })
  isActive?: boolean;
}

export class DietMealItemEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: 150, description: 'گرم' }) quantityGrams!: number;
  @ApiPropertyOptional({ example: 'پخته', nullable: true }) notes?: string | null;
  @ApiProperty({ type: DietFoodEntity }) food!: DietFoodEntity;
  @ApiProperty({ type: NutritionEntity, description: 'مقدار این آیتم = food(per 100g) × quantityGrams / 100' })
  nutrition!: NutritionEntity;
}

export class DietMealEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'], example: 'BREAKFAST' }) type!: string;
  @ApiProperty({ enum: ['PRIMARY', 'SECONDARY', 'TERTIARY'], example: 'PRIMARY', description: 'PRIMARY = اصلی، بقیه = جایگزین' })
  priority!: string;
  @ApiProperty({ example: 1, description: 'ترتیب نمایش در روز' }) order!: number;
  @ApiPropertyOptional({ example: 'قبل از تمرین', nullable: true }) notes?: string | null;
  @ApiProperty({ type: [DietMealItemEntity] }) items!: DietMealItemEntity[];
  @ApiProperty({ type: NutritionEntity, description: 'جمع آیتم‌های همین وعده' }) nutrition!: NutritionEntity;
}

export class DietDayEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: 0, description: '۰=شنبه … ۶=جمعه' }) weekday!: number;
  @ApiPropertyOptional({ example: 'روز تمرین پا', nullable: true }) title?: string | null;
  @ApiPropertyOptional({ example: 'آب بیشتر بنوشید', nullable: true }) notes?: string | null;
  @ApiProperty({ type: [DietMealEntity], description: 'مرتب بر اساس order' }) meals!: DietMealEntity[];
  @ApiProperty({
    type: NutritionEntity,
    description: 'جمع وعده‌های PRIMARY همین روز (جایگزین‌ها حساب نمی‌شوند). برای مقایسه با targetCalories فاز/برنامه',
  })
  nutrition!: NutritionEntity;
}

export class DietPhaseEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: 'فاز کات' }) title!: string;
  @ApiProperty({ example: 1 }) startWeek!: number;
  @ApiProperty({ example: 4 }) endWeek!: number;
  @ApiProperty({ example: 1 }) order!: number;
  @ApiPropertyOptional({ example: 2200, nullable: true, description: 'اگر null بود از targetCalories خود برنامه استفاده کن' })
  targetCalories?: number | null;
  @ApiPropertyOptional({ example: 140, nullable: true }) targetProteinG?: number | null;
  @ApiPropertyOptional({ example: 200, nullable: true }) targetCarbsG?: number | null;
  @ApiPropertyOptional({ example: 60, nullable: true }) targetFatG?: number | null;
  @ApiProperty({ type: [DietDayEntity], description: 'مرتب بر اساس weekday' }) days!: DietDayEntity[];
}

// ============ رکوردهای ساده (پاسخ POST / PUT) ============
export class DietPhaseRecordEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: UUID }) planId!: string;
  @ApiProperty({ example: 'فاز کات' }) title!: string;
  @ApiProperty({ example: 1 }) startWeek!: number;
  @ApiProperty({ example: 4 }) endWeek!: number;
  @ApiProperty({ example: 1 }) order!: number;
  @ApiPropertyOptional({ example: 2200, nullable: true }) targetCalories?: number | null;
  @ApiPropertyOptional({ example: 140, nullable: true }) targetProteinG?: number | null;
  @ApiPropertyOptional({ example: 200, nullable: true }) targetCarbsG?: number | null;
  @ApiPropertyOptional({ example: 60, nullable: true }) targetFatG?: number | null;
}

export class DietDayRecordEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: UUID }) planId!: string;
  @ApiProperty({ example: UUID }) dietPhaseId!: string;
  @ApiProperty({ example: 0, description: '۰=شنبه … ۶=جمعه' }) weekday!: number;
  @ApiPropertyOptional({ example: 'روز تمرین پا', nullable: true }) title?: string | null;
  @ApiPropertyOptional({ example: 'نکته', nullable: true }) notes?: string | null;
}

export class DietDayCopyEntity extends DietDayRecordEntity {
  @ApiProperty({ example: 4, description: 'تعداد وعده‌های کپی‌شده' }) mealCount!: number;
}

export class DietMealRecordEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: UUID }) dayId!: string;
  @ApiProperty({ enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'], example: 'LUNCH' }) type!: string;
  @ApiProperty({ enum: ['PRIMARY', 'SECONDARY', 'TERTIARY'], example: 'PRIMARY' }) priority!: string;
  @ApiProperty({ example: 2 }) order!: number;
  @ApiPropertyOptional({ example: 'نکته', nullable: true }) notes?: string | null;
}

export class DietMealItemRecordEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: UUID }) mealId!: string;
  @ApiProperty({ example: UUID }) foodId!: string;
  @ApiProperty({ example: 150, description: 'گرم' }) quantityGrams!: number;
  @ApiPropertyOptional({ example: 'پخته', nullable: true }) notes?: string | null;
}

// ============ برنامه ============
export class DietPlanCoachEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: 'مربی رضا' }) title!: string;
  @ApiProperty({ example: 'coach-reza' }) slug!: string;
}

export class DietPlanGoalEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: 'افزایش حجم' }) title!: string;
  @ApiPropertyOptional({ example: 'https://cdn.example.com/goal.png', nullable: true }) logo?: string | null;
}

/** لیست‌ها + پاسخ ایجاد/ویرایش برنامه */
export class DietPlanSummaryEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: 'برنامه غذایی حجم ۸ هفته' }) title!: string;
  @ApiPropertyOptional({ example: 'برنامه ۸ هفته‌ای...', nullable: true }) description?: string | null;
  @ApiProperty({ type: [String], example: ['https://cdn.example.com/diet/cover.jpg'] }) coverImage!: string[];

  @ApiProperty({ example: 500000, description: 'قیمت اصلی (تومان)' })
  price!: number;

  @ApiPropertyOptional({
    example: 400000,
    nullable: true,
    description: 'قیمت تخفیفی. در endpointهای عمومی اگر discountExpired گذشته باشد null برمی‌گردد',
  })
  discountPrice?: number | null;

  @ApiPropertyOptional({ example: '2026-12-30T00:00:00.000Z', nullable: true }) discountExpired?: Date | null;
  @ApiPropertyOptional({ example: 8, nullable: true }) durationWeeks?: number | null;
  @ApiPropertyOptional({ example: 2500, nullable: true, description: 'کالری هدف پیش‌فرض' }) targetCalories?: number | null;
  @ApiPropertyOptional({ example: 150, nullable: true }) targetProteinG?: number | null;
  @ApiPropertyOptional({ example: 250, nullable: true }) targetCarbsG?: number | null;
  @ApiPropertyOptional({ example: 70, nullable: true }) targetFatG?: number | null;

  @ApiProperty({ example: 4.5, description: 'میانگین امتیاز (۰ تا ۵)' }) avgRating!: number;
  @ApiProperty({ example: 12 }) countRating!: number;
  @ApiProperty({ example: true }) isPublished!: boolean;
  @ApiProperty({ enum: ['COACH', 'SITE', 'AI'], example: 'COACH' }) source!: string;
  @ApiPropertyOptional({ example: UUID, nullable: true }) trainingGoalId?: string | null;

  @ApiPropertyOptional({ type: DietPlanCoachEntity, nullable: true, description: 'برای برنامه‌های SITE/AI برابر null' })
  coach?: DietPlanCoachEntity | null;

  @ApiPropertyOptional({ type: DietPlanGoalEntity, nullable: true })
  trainingGoal?: DietPlanGoalEntity | null;

  @ApiProperty({ example: '2026-11-01T00:00:00.000Z' }) createdAt!: Date;
  @ApiProperty({ example: '2026-11-07T00:00:00.000Z' }) updatedAt!: Date;
}

/** GET plan/my/:id — نمای کامل مربی */
export class DietPlanDetailEntity extends DietPlanSummaryEntity {
  @ApiProperty({ type: [DietPhaseEntity], description: 'همه‌ی فازها با روزها، وعده‌ها و آیتم‌ها (مرتب بر اساس startWeek)' })
  dietPhases!: DietPhaseEntity[];
}

/** GET plan/:id — نمای عمومی محدود (پیش‌نمایش) */
export class DietPlanPublicEntity extends DietPlanSummaryEntity {
  @ApiProperty({ example: true, description: 'همیشه true؛ یعنی dietPhases فقط پیش‌نمایش است نه کل برنامه' })
  isPreview!: boolean;

  @ApiProperty({ example: 3, description: 'تعداد کل فازها' }) phaseCount!: number;
  @ApiProperty({ example: 21, description: 'تعداد کل روزهای تعریف‌شده در همه‌ی فازها' }) dayCount!: number;

  @ApiProperty({
    type: [DietPhaseEntity],
    description: 'فقط اولین فاز، حداکثر ۳ روز، ۳ وعده در هر روز و ۳ آیتم در هر وعده',
  })
  dietPhases!: DietPhaseEntity[];
}

export class DietPublishEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: true, description: 'وضعیت جدید انتشار' }) isPublished!: boolean;
}

export class SuccessEntity {
  @ApiProperty({ example: true }) success!: boolean;
}
