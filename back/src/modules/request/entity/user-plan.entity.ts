import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const UUID = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
const PLAN_STATUS = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
const PLAN_TYPE = ['WORKOUT', 'DIET', 'ALL'];

// ═════════ شکل روزها در snapshot ═════════
export class SnapshotExerciseEntity {
  @ApiProperty({ example: UUID, description: 'برای جزئیات کامل حرکت (ویدیو، مراحل، عضلات) از endpoint حرکت‌ها با همین id استفاده کن' })
  exerciseId!: string;
  @ApiProperty({ example: 'پرس سینه' }) title!: string;
  @ApiPropertyOptional({ nullable: true }) cover?: string | null;
  @ApiProperty({ example: 1 }) order!: number;
  @ApiPropertyOptional({ example: 4, nullable: true }) sets?: number | null;
  @ApiPropertyOptional({ example: '8-10', nullable: true }) reps?: string | null;
  @ApiPropertyOptional({ nullable: true }) durationSec?: number | null;
  @ApiPropertyOptional({ example: 90, nullable: true }) restSec?: number | null;
  @ApiPropertyOptional({ nullable: true }) notes?: string | null;
}

export class SnapshotWorkoutDayEntity {
  @ApiProperty({ example: 0, description: '۰=شنبه … ۶=جمعه' }) weekday!: number;
  @ApiPropertyOptional({ nullable: true }) title?: string | null;
  @ApiProperty({ example: false }) isRestDay!: boolean;
  @ApiPropertyOptional({ nullable: true }) notes?: string | null;
  @ApiProperty({ type: [SnapshotExerciseEntity] }) exercises!: SnapshotExerciseEntity[];
}

export class MacrosEntity {
  @ApiProperty({ example: 520 }) calories!: number;
  @ApiProperty({ example: 38.5 }) proteinG!: number;
  @ApiProperty({ example: 60 }) carbsG!: number;
  @ApiProperty({ example: 12.5 }) fatG!: number;
}

export class TargetEntity {
  @ApiPropertyOptional({ example: 2200, nullable: true }) calories?: number | null;
  @ApiPropertyOptional({ nullable: true }) proteinG?: number | null;
  @ApiPropertyOptional({ nullable: true }) carbsG?: number | null;
  @ApiPropertyOptional({ nullable: true }) fatG?: number | null;
}

export class SnapshotDietItemEntity {
  @ApiProperty({ example: UUID }) foodId!: string;
  @ApiProperty({ example: 'سینه مرغ' }) name!: string;
  @ApiProperty({ example: 150, description: 'گرم' }) grams!: number;
  @ApiPropertyOptional({ nullable: true }) notes?: string | null;
  @ApiProperty({ example: 247.5, description: 'کالری همین مقدار (از قبل محاسبه شده)' }) calories!: number;
  @ApiProperty() proteinG!: number;
  @ApiProperty() carbsG!: number;
  @ApiProperty() fatG!: number;
}

export class SnapshotDietMealEntity {
  @ApiProperty({ example: UUID, description: 'شناسه‌ی پایدار وعده؛ در لاگ (doneMealIds) از همین استفاده می‌شود' }) id!: string;
  @ApiProperty({ enum: ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] }) type!: string;
  @ApiProperty({ enum: ['PRIMARY', 'SECONDARY', 'TERTIARY'], description: 'SECONDARY/TERTIARY جایگزین‌اند' }) priority!: string;
  @ApiProperty({ example: 1 }) order!: number;
  @ApiPropertyOptional({ nullable: true }) notes?: string | null;
  @ApiProperty({ type: MacrosEntity }) nutrition!: MacrosEntity;
  @ApiProperty({ type: [SnapshotDietItemEntity] }) items!: SnapshotDietItemEntity[];
}

export class SnapshotDietDayEntity {
  @ApiProperty({ example: 0 }) weekday!: number;
  @ApiPropertyOptional({ nullable: true }) title?: string | null;
  @ApiPropertyOptional({ nullable: true }) notes?: string | null;
  @ApiProperty({ type: TargetEntity, description: 'هدف مؤثر این روز (هدف فاز، در غیر این صورت هدف برنامه)' }) target!: TargetEntity;
  @ApiProperty({ type: MacrosEntity, description: 'جمع وعده‌های PRIMARY' }) nutrition!: MacrosEntity;
  @ApiProperty({ type: [SnapshotDietMealEntity] }) meals!: SnapshotDietMealEntity[];
}

// ═════════ پاسخ‌ها ═════════
export class UserPlanListItemEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: 'برنامه حجم ۸ هفته' }) title!: string;
  @ApiProperty({ enum: PLAN_STATUS }) status!: string;
  @ApiProperty({ enum: PLAN_TYPE }) type!: string;
  @ApiPropertyOptional({ enum: ['COACH', 'SITE', 'AI'] }) source?: string;
  @ApiPropertyOptional({ example: '2026-11-10', nullable: true }) startDate?: string | null;
  @ApiPropertyOptional({ example: '2027-01-04', nullable: true }) endDate?: string | null;
  @ApiPropertyOptional({ nullable: true }) activatedAt?: Date | null;
  @ApiPropertyOptional({ nullable: true, description: 'برای برنامه‌های سایت/AI برابر null' }) coach?: { id: string; title: string; slug: string } | null;
}

export class CurrentUserPlanEntity extends UserPlanListItemEntity {
  @ApiProperty({ example: true }) hasWorkout!: boolean;
  @ApiProperty({ example: true }) hasDiet!: boolean;
  @ApiPropertyOptional({ example: 3, nullable: true, description: 'هفته‌ی جاری برنامه (۱ = هفته‌ی اول)؛ قبل از شروع ≤ ۰' }) currentWeek?: number | null;
  @ApiProperty({ example: true, description: 'startDate ≤ امروز' }) isStarted!: boolean;
  @ApiProperty({ example: false, description: 'endDate < امروز (در صورتی که cron هنوز نبسته)' }) isExpired!: boolean;
}

export class CurrentUserPlanResponseEntity {
  @ApiPropertyOptional({ type: CurrentUserPlanEntity, nullable: true, description: 'null اگر برنامه‌ی فعالی ندارد' })
  plan!: CurrentUserPlanEntity | null;
}

class TodayPlanRefEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: PLAN_TYPE }) type!: string;
  @ApiPropertyOptional({ nullable: true }) startDate?: string | null;
  @ApiPropertyOptional({ nullable: true }) endDate?: string | null;
}

export class TodayEntity {
  @ApiProperty({ example: '2026-11-09' }) date!: string;
  @ApiPropertyOptional({ type: TodayPlanRefEntity, nullable: true, description: 'null اگر برنامه‌ی فعالی ندارد' }) plan!: TodayPlanRefEntity | null;
  @ApiPropertyOptional({ example: 2, nullable: true }) workoutWeek!: number | null;
  @ApiPropertyOptional({ type: SnapshotWorkoutDayEntity, nullable: true, description: 'null = برنامه‌ی ورزشی این روز تعریف نشده (قبل/بعد از بازه یا روز بدون تعریف)' })
  workout!: SnapshotWorkoutDayEntity | null;
  @ApiPropertyOptional({ example: 2, nullable: true }) dietWeek!: number | null;
  @ApiPropertyOptional({ type: SnapshotDietDayEntity, nullable: true }) diet!: SnapshotDietDayEntity | null;
}

export class PartOutlineEntity {
  @ApiProperty({ example: 1, description: 'شماره‌ی فاز ۱-based' }) phaseNumber!: number;
  @ApiProperty({ example: 'فاز ۱' }) title!: string;
  @ApiProperty({ example: 1 }) startWeek!: number;
  @ApiProperty({ example: 3 }) endWeek!: number;
}

export class PartEntity {
  @ApiProperty({ example: UUID }) planId!: string;
  @ApiProperty({ enum: ['workout', 'diet'] }) part!: string;
  @ApiPropertyOptional({ example: 3, nullable: true, description: 'هفته‌ی جاری محاسبه‌شده از startDate' })
  currentWeek!: number | null;
  @ApiPropertyOptional({ example: 3, nullable: true }) requestedWeek!: number | null;
  @ApiPropertyOptional({ example: 1, nullable: true, description: 'شماره‌ی فاز ۱-based' })
  phaseNumber!: number | null;
  @ApiProperty({ example: 8 }) durationWeeks!: number;
  @ApiProperty({ type: [PartOutlineEntity], description: 'فهرست همه‌ی فازها بدون days (سبک)' })
  outline!: PartOutlineEntity[];
  @ApiPropertyOptional({
    nullable: true,
    description:
      'فقط فاز انتخاب‌شده با days کامل: { phaseNumber, title, startWeek, endWeek, days }. ' +
      'null اگر هفته/فاز خارج از بازه باشد',
  })
  phase!: Record<string, unknown> | null;
}

export class DraftResultEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ enum: PLAN_STATUS, example: 'DRAFT' }) status!: string;
  @ApiProperty({ enum: PLAN_TYPE }) type!: string;
  @ApiProperty({ example: true, description: 'false یعنی پیش‌نویسی از قبل برای این درخواست وجود داشته (idempotent)' }) created!: boolean;
}

export class CoachUserPlanListItemEntity extends UserPlanListItemEntity {
  @ApiProperty({ example: UUID, nullable: true }) requestId?: string | null;
  @ApiProperty() createdAt!: Date;
  @ApiProperty({ description: '{ id, name, avatar }' }) user!: { id: string; name: string; avatar: string | null };
}

export class CoachUserPlanDetailEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty({ enum: PLAN_STATUS }) status!: string;
  @ApiProperty({ enum: PLAN_TYPE }) type!: string;
  @ApiPropertyOptional({ nullable: true }) startDate?: string | null;
  @ApiPropertyOptional({ nullable: true }) endDate?: string | null;
  @ApiProperty({ description: '{ id, name, avatar }' }) user!: { id: string; name: string; avatar: string | null };
  @ApiPropertyOptional({
    nullable: true,
    description: 'کل snapshot ورزشی: { v, templateId, title, durationWeeks, phases:[{ title, startWeek, endWeek, days:[...] }] }. null اگر پلن بخش ورزشی ندارد',
  })
  snapshotExercise?: Record<string, unknown> | null;
  @ApiPropertyOptional({
    nullable: true,
    description: 'کل snapshot غذایی: { v, templateId, title, durationWeeks, startDate, target, phases:[...] }. null اگر پلن بخش غذایی ندارد',
  })
  snapshotDiet?: Record<string, unknown> | null;
}

export class UpdatedEntity {
  @ApiProperty({ example: UUID }) id!: string;
  @ApiProperty({ example: true }) updated!: boolean;
}

export class ActivatedEntity {
  @ApiProperty({ example: UUID, description: 'برای درخواست «فقط غذایی» id پلن فعال کاربر است (نه پیش‌نویس)' }) id!: string;
  @ApiProperty({ example: 'ACTIVE' }) status!: string;
  @ApiProperty({ enum: PLAN_TYPE }) type!: string;
  @ApiProperty({ example: '2026-11-10' }) startDate!: string;
  @ApiProperty({ example: '2027-01-04' }) endDate!: string;
}
