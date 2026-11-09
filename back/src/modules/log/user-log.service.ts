import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { toJalaali } from 'jalaali-js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import { CreateUserLogDto, UpdateUserLogDto } from './dto/user-log.dto.js';
import { MonthlyStatEntity, WeeklyStatEntity } from './entity/user-log.entity.js';

const DAY_MS = 86_400_000;
const MAX_STATS_RANGE_DAYS = 400;

/** فقط همین فیلدها از بیرون قابل ویرایش‌اند (جلوگیری از mass-assignment) */
const EDITABLE_FIELDS = [
  'weightKg', 'extraExercises', 'caloriesBurned', 'extraMeals',
  'caloriesPlanned', 'caloriesConsumed', 'proteinG', 'carbsG', 'fatG', 'userNote',
] as const;

type PlanContext = {
  workoutPlanId: string | null;
  dietPlanId: string | null;
  startDate: Date | null;
  snapshotExercise: unknown;
  snapshotDiet: unknown;
};

type PlannedForDay = { exerciseIds: string[]; mealIds: string[]; calories: number | null };

@Injectable()
export class UserLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  private getLimit(limit?: any) {
    return Math.max(1, Number(limit) || Number(this.configService.get('limit.coach')) || 10);
  }

  // ============ Date helpers ============

  /**
   * ورودی همیشه YYYY-MM-DD است (روز تقویمی تهران).
   * مستقیم پارس می‌شود تا به timezone سرور وابسته نباشد.
   */
  private normalizeDate(input: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input ?? '');
    if (!m) throw new BadRequestException('تاریخ باید به فرمت YYYY-MM-DD باشد');

    const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const date = new Date(Date.UTC(y, mo - 1, d));
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
      throw new BadRequestException('تاریخ نامعتبر است');
    }
    return date;
  }

  private toDateString(d: Date): string {
    return d.toISOString().slice(0, 10);
  }

  /** تنها نقطه‌ای که jalaliYear/jalaliMonth ساخته می‌شود */
  private toJalali(date: Date) {
    const { jy, jm } = toJalaali(
      date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
    );
    return { jalaliYear: jy, jalaliMonth: jm };
  }

  private hasCode(e: unknown, code: string): boolean {
    return typeof e === 'object' && e !== null && (e as { code?: string }).code === code;
  }

  // ============ Planned (از روی برنامه کاربر) ============

  /**
   * فرض‌ها:
   *  - weekday: ۰ = شنبه ... ۶ = جمعه
   *  - شماره هفته نسبت به startDate برنامه حساب می‌شود (هفته‌ی ۱ = ۷ روز اول)
   *  - اگر snapshot (ویرایش دستی مربی) وجود داشته باشد، فعلاً planned خالی است
   */
  private async resolvePlanned(plan: PlanContext, date: Date): Promise<PlannedForDay> {
    const empty: PlannedForDay = { exerciseIds: [], mealIds: [], calories: null };
    if (!plan.startDate) return empty;

    const diffDays = Math.floor((date.getTime() - plan.startDate.getTime()) / DAY_MS);
    if (diffDays < 0) return empty;

    const weekNo = Math.floor(diffDays / 7) + 1;
    const weekday = (date.getUTCDay() + 1) % 7; // JS: یکشنبه=۰ ... شنبه=۶  →  شنبه=۰ ... جمعه=۶

    const [exerciseIds, diet] = await Promise.all([
      this.plannedExercises(plan, weekNo, weekday),
      this.plannedDiet(plan, weekNo, weekday),
    ]);

    return { exerciseIds, mealIds: diet.mealIds, calories: diet.calories };
  }

  private async plannedExercises(plan: PlanContext, weekNo: number, weekday: number): Promise<string[]> {
    // TODO: وقتی ساختار snapshotExercise مشخص شد، اینجا از آن بخوان
    if (!plan.workoutPlanId || plan.snapshotExercise) return [];

    const phase = await this.prisma.workoutPhase.findFirst({
      where: { planId: plan.workoutPlanId, startWeek: { lte: weekNo }, endWeek: { gte: weekNo } },
      select: { id: true },
    });

    const day = await this.prisma.workoutDay.findFirst({
      where: {
        planId: plan.workoutPlanId,
        weekday,
        workoutPhaseId: phase?.id ?? null,
        isRestDay: false,
      },
      select: { exercises: { orderBy: { order: 'asc' }, select: { exerciseId: true } } },
    });

    return day?.exercises.map((e) => e.exerciseId) ?? [];
  }

  private async plannedDiet(
    plan: PlanContext, weekNo: number, weekday: number,
  ): Promise<{ mealIds: string[]; calories: number | null }> {
    // TODO: وقتی ساختار snapshotDiet مشخص شد، اینجا از آن بخوان
    if (!plan.dietPlanId || plan.snapshotDiet) return { mealIds: [], calories: null };

    const [phase, dietPlan] = await Promise.all([
      this.prisma.dietPhase.findFirst({
        where: { planId: plan.dietPlanId, startWeek: { lte: weekNo }, endWeek: { gte: weekNo } },
        select: { id: true, targetCalories: true },
      }),
      this.prisma.dietPlan.findUnique({
        where: { id: plan.dietPlanId },
        select: { targetCalories: true },
      }),
    ]);

    const calories = phase?.targetCalories ?? dietPlan?.targetCalories ?? null;
    if (!phase) return { mealIds: [], calories };

    const day = await this.prisma.dietDay.findFirst({
      where: { dietPhaseId: phase.id, weekday },
      select: {
        // فقط وعده‌های اصلی؛ SECONDARY/TERTIARY جایگزین هستند و نباید planned را باد کنند
        meals: { where: { priority: 'PRIMARY' }, orderBy: { order: 'asc' }, select: { id: true } },
      },
    });

    return { mealIds: day?.meals.map((m) => m.id) ?? [], calories };
  }

  // ============ CRUD ============

  async create(userId: string, dto: CreateUserLogDto) {
    const date = this.normalizeDate(dto.date);

    let planned: PlannedForDay = { exerciseIds: [], mealIds: [], calories: null };
    if (dto.userPlanId) {
      const plan = await this.prisma.userPlan.findFirst({
        where: { id: dto.userPlanId, userId },
        select: {
          workoutPlanId: true, dietPlanId: true, startDate: true,
          snapshotExercise: true, snapshotDiet: true,
        },
      });
      if (!plan) throw new NotFoundException('برنامه یافت نشد یا متعلق به شما نیست');
      planned = await this.resolvePlanned(plan, date);
    }

    const doneExerciseIds = [...new Set(dto.doneExerciseIds ?? [])];
    const doneMealIds = [...new Set(dto.doneMealIds ?? [])];

    try {
      // بدون findUnique قبلی: unique constraint خودش تکراری را رد می‌کند (یک کوئری کمتر + بدون race)
      return await this.prisma.userLog.create({
        data: {
          userId,
          userPlanId: dto.userPlanId,
          date,
          ...this.toJalali(date),
          weightKg: dto.weightKg,

          plannedExerciseIds: planned.exerciseIds,
          doneExerciseIds,
          plannedExercises: planned.exerciseIds.length,
          doneExercises: doneExerciseIds.length,
          extraExercises: dto.extraExercises ?? [],
          caloriesBurned: dto.caloriesBurned,

          plannedMealIds: planned.mealIds,
          doneMealIds,
          plannedMeals: planned.mealIds.length,
          doneMeals: doneMealIds.length,
          extraMeals: dto.extraMeals ?? [],
          caloriesPlanned: planned.calories ?? dto.caloriesPlanned,
          caloriesConsumed: dto.caloriesConsumed,
          proteinG: dto.proteinG,
          carbsG: dto.carbsG,
          fatG: dto.fatG,

          userNote: dto.userNote,
        },
      });
    } catch (e) {
      if (this.hasCode(e, 'P2002')) throw new ConflictException('برای این تاریخ قبلاً لاگ ثبت شده');
      throw e;
    }
  }

  async update(userId: string, id: string, dto: UpdateUserLogDto) {
    const data: any = {};
    for (const key of EDITABLE_FIELDS) {
      if (dto[key] !== undefined) data[key] = dto[key];
    }
    if (dto.doneExerciseIds) {
      const ids = [...new Set(dto.doneExerciseIds)];
      data.doneExerciseIds = ids;
      data.doneExercises = ids.length;
    }
    if (dto.doneMealIds) {
      const ids = [...new Set(dto.doneMealIds)];
      data.doneMealIds = ids;
      data.doneMeals = ids.length;
    }

    try {
      // where با id + userId: مالکیت و آپدیت در یک کوئری
      return await this.prisma.userLog.update({ where: { id, userId }, data });
    } catch (e) {
      if (this.hasCode(e, 'P2025')) throw new NotFoundException('لاگ یافت نشد یا متعلق به شما نیست');
      throw e;
    }
  }

  async delete(userId: string, id: string) {
    const { count } = await this.prisma.userLog.deleteMany({ where: { id, userId } });
    if (!count) throw new NotFoundException('لاگ یافت نشد یا متعلق به شما نیست');
    return { success: true };
  }

  // ============ Query ============

  async getByDate(userId: string, dateStr: string) {
    const date = this.normalizeDate(dateStr);
    const log = await this.prisma.userLog.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (!log) throw new NotFoundException('لاگ برای این تاریخ یافت نشد');
    return log;
  }

  async getMyLogs(userId: string, query: QueryDefaultDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = { userId };

    const [data, count] = await Promise.all([
      this.prisma.userLog.findMany({
        where, skip, take: limitPage,
        orderBy: { date: 'desc' },
        select: {
          id: true, date: true, weightKg: true,
          doneExercises: true, plannedExercises: true,
          doneMeals: true, plannedMeals: true,
          caloriesConsumed: true,
        },
      }),
      this.prisma.userLog.count({ where }),
    ]);
    return { logs: data, pagination: pagination(count, page, limitPage) };
  }

  async getByPlan(userId: string, planId: string, query: QueryDefaultDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = { userId, userPlanId: planId };

    const [data, count] = await Promise.all([
      this.prisma.userLog.findMany({
        where, skip, take: limitPage,
        orderBy: { date: 'desc' },
      }),
      this.prisma.userLog.count({ where }),
    ]);
    return { logs: data, pagination: pagination(count, page, limitPage) };
  }

  // ============ Stats ============

  /** آمار ماهانه یک سال شمسی — از ایندکس (user_id, jalali_year, jalali_month) استفاده می‌کند */
  async getMonthlyStats(userId: string, year: number) {
    const months = await this.prisma.$queryRaw<MonthlyStatEntity[]>`
      SELECT
        jalali_month                                              AS "month",
        COUNT(*)::int                                             AS "loggedDays",
        ROUND(AVG(weight_kg), 2)::float                           AS "avgWeightKg",
        ((ARRAY_AGG(weight_kg ORDER BY date DESC)
            FILTER (WHERE weight_kg IS NOT NULL))[1])::float      AS "lastWeightKg",
        COALESCE(SUM(calories_burned), 0)::int                    AS "caloriesBurned",
        ROUND(AVG(calories_consumed))::int                        AS "avgCaloriesConsumed",
        COALESCE(SUM(done_exercises), 0)::int                     AS "doneExercises",
        COALESCE(SUM(planned_exercises), 0)::int                  AS "plannedExercises",
        ROUND(SUM(done_exercises)::numeric
              / NULLIF(SUM(planned_exercises), 0), 4)::float      AS "workoutCompletion",
        COALESCE(SUM(done_meals), 0)::int                         AS "doneMeals",
        COALESCE(SUM(planned_meals), 0)::int                      AS "plannedMeals",
        ROUND(SUM(done_meals)::numeric
              / NULLIF(SUM(planned_meals), 0), 4)::float          AS "mealCompletion"
      FROM user_logs
      WHERE user_id = ${userId}::uuid
        AND jalali_year = ${year}::int
      GROUP BY jalali_month
      ORDER BY jalali_month
    `;
    return { year, months };
  }

  /**
   * آمار هفتگی با هفته‌ی شنبه تا جمعه.
   * date + 2 → شنبه به دوشنبه می‌رسد؛ date_trunc('week') از دوشنبه شروع می‌کند؛ بعد ۲ روز برمی‌گردیم.
   */
  async getWeeklyStats(userId: string, fromStr: string, toStr: string) {
    const from = this.normalizeDate(fromStr);
    const to = this.normalizeDate(toStr);

    if (to < from) throw new BadRequestException('تاریخ پایان باید بعد از تاریخ شروع باشد');
    if ((to.getTime() - from.getTime()) / DAY_MS > MAX_STATS_RANGE_DAYS) {
      throw new BadRequestException(`حداکثر بازه‌ی مجاز ${MAX_STATS_RANGE_DAYS} روز است`);
    }

    const fromSql = this.toDateString(from);
    const toSql = this.toDateString(to);

    const weeks = await this.prisma.$queryRaw<WeeklyStatEntity[]>`
      SELECT
        to_char((date_trunc('week', (date + 2)::timestamp)::date - 2), 'YYYY-MM-DD') AS "weekStart",
        COUNT(*)::int                                             AS "loggedDays",
        ROUND(AVG(weight_kg), 2)::float                           AS "avgWeightKg",
        ((ARRAY_AGG(weight_kg ORDER BY date DESC)
            FILTER (WHERE weight_kg IS NOT NULL))[1])::float      AS "lastWeightKg",
        COALESCE(SUM(calories_burned), 0)::int                    AS "caloriesBurned",
        ROUND(AVG(calories_consumed))::int                        AS "avgCaloriesConsumed",
        COALESCE(SUM(done_exercises), 0)::int                     AS "doneExercises",
        COALESCE(SUM(planned_exercises), 0)::int                  AS "plannedExercises",
        ROUND(SUM(done_exercises)::numeric
              / NULLIF(SUM(planned_exercises), 0), 4)::float      AS "workoutCompletion",
        COALESCE(SUM(done_meals), 0)::int                         AS "doneMeals",
        COALESCE(SUM(planned_meals), 0)::int                      AS "plannedMeals",
        ROUND(SUM(done_meals)::numeric
              / NULLIF(SUM(planned_meals), 0), 4)::float          AS "mealCompletion"
      FROM user_logs
      WHERE user_id = ${userId}::uuid
        AND date >= ${fromSql}::date
        AND date <= ${toSql}::date
      GROUP BY 1
      ORDER BY 1
    `;
    return { from: fromSql, to: toSql, weeks };
  }

  // ============ Coach ============

  async updateCoachNote(coachUserId: string, logId: string, coachNote: string) {
    const coach = await this.prisma.coach.findUnique({
      where: { userId: coachUserId }, select: { id: true },
    });
    if (!coach) throw new NotFoundException('حساب مربی یافت نشد');

    const log = await this.prisma.userLog.findFirst({
      where: { id: logId, userPlan: { coachId: coach.id } },
      select: { id: true },
    });
    if (!log) throw new NotFoundException('لاگ یافت نشد یا مربوط به شما نیست');

    return this.prisma.userLog.update({
      where: { id: logId },
      data: { coachNote },
    });
  }

  async getCoachUserLogs(coachUserId: string, userId: string, query: QueryDefaultDto) {
    const coach = await this.prisma.coach.findUnique({
      where: { userId: coachUserId }, select: { id: true },
    });
    if (!coach) throw new NotFoundException('حساب مربی یافت نشد');

    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = { userId, userPlan: { coachId: coach.id } };

    const [data, count] = await Promise.all([
      this.prisma.userLog.findMany({
        where, skip, take: limitPage,
        orderBy: { date: 'desc' },
      }),
      this.prisma.userLog.count({ where }),
    ]);
    return { logs: data, pagination: pagination(count, page, limitPage) };
  }
}
