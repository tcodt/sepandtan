import {
  Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { toJalaali } from 'jalaali-js';
import { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import {
  CreateUserLogDto, UpdateUserLogDto, LogRangeQueryDto, LogSortBy,
} from './dto/user-log.dto.js';
import { MonthlyStatEntity, WeeklyStatEntity, YearlyStatEntity } from './entity/user-log.entity.js';

const DAY_MS = 86_400_000;
/** سقف بازه برای لیست و آمار هفتگی — یک سال */
const MAX_RANGE_DAYS = 365;

const EDITABLE_FIELDS = [
  'weightKg', 'extraExercises', 'caloriesBurned', 'extraMeals',
  'caloriesPlanned', 'caloriesConsumed', 'proteinG', 'carbsG', 'fatG',
  'userNote', 'startimetAt', 'endtimeAt',
] as const;

type PlanContext = {
  workoutPlanId: string | null;
  dietPlanId: string | null;
  startDate: Date | null;
  snapshotExercise: unknown;
  snapshotDiet: unknown;
};

type PlannedForDay = { exerciseIds: string[]; mealIds: string[]; calories: number | null };

type SnapPhase = {
  startWeek: number;
  endWeek: number;
  days: Array<{
    weekday: number;
    isRestDay?: boolean;
    exercises?: Array<{ exerciseId: string }>;
    meals?: Array<{ id: string; priority?: string }>;
    target?: { calories?: number | null };
    nutrition?: { calories?: number };
  }>;
};

@Injectable()
export class UserLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  private getLimit(limit?: number) {
    return Math.max(1, Math.min(100, Number(limit) || Number(this.configService.get('limit.coach')) || 10));
  }

  // ============ Date helpers ============

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

  private toJalali(date: Date) {
    const { jy, jm } = toJalaali(
      date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(),
    );
    return { jalaliYear: jy, jalaliMonth: jm };
  }

  private hasCode(e: unknown, code: string): boolean {
    return typeof e === 'object' && e !== null && (e as { code?: string }).code === code;
  }

  /** بازه حداکثر ۳۶۵ روز؛ سالانه جداست و فقط یک سال شمسی می‌گیرد */
  private assertRange(from: Date, to: Date) {
    if (to < from) throw new BadRequestException('تاریخ پایان باید بعد از تاریخ شروع باشد');
    const days = (to.getTime() - from.getTime()) / DAY_MS;
    if (days > MAX_RANGE_DAYS) {
      throw new BadRequestException(`حداکثر بازه‌ی مجاز ${MAX_RANGE_DAYS} روز است`);
    }
  }

  private sortOrder(sort?: LogSortBy): Prisma.UserLogOrderByWithRelationInput {
    switch (sort) {
      case LogSortBy.DATE_ASC:
        return { date: 'asc' };
      case LogSortBy.WEIGHT_DESC:
        return { weightKg: 'desc' };
      case LogSortBy.WEIGHT_ASC:
        return { weightKg: 'asc' };
      case LogSortBy.DONE_EX_DESC:
        return { doneExercises: 'desc' };
      case LogSortBy.DONE_MEALS_DESC:
        return { doneMeals: 'desc' };
      case LogSortBy.CALORIES_DESC:
        return { caloriesConsumed: 'desc' };
      case LogSortBy.DATE_DESC:
      default:
        return { date: 'desc' };
    }
  }

  // ============ Planned از snapshot (اولویت) یا قالب ============

  private async resolvePlanned(plan: PlanContext, date: Date): Promise<PlannedForDay> {
    const empty: PlannedForDay = { exerciseIds: [], mealIds: [], calories: null };
    if (!plan.startDate) return empty;

    const diffDays = Math.floor((date.getTime() - plan.startDate.getTime()) / DAY_MS);
    if (diffDays < 0) return empty;

    const weekNo = Math.floor(diffDays / 7) + 1;
    const weekday = (date.getUTCDay() + 1) % 7; // شنبه=۰ … جمعه=۶

    // اولویت با snapshot — قبلاً برعکس بود و با وجود snapshot خالی برمی‌گشت
    const fromSnap = this.plannedFromSnapshots(plan, weekNo, weekday);
    if (fromSnap) return fromSnap;

    const [exerciseIds, diet] = await Promise.all([
      this.plannedExercisesFromTemplate(plan, weekNo, weekday),
      this.plannedDietFromTemplate(plan, weekNo, weekday),
    ]);
    return { exerciseIds, mealIds: diet.mealIds, calories: diet.calories };
  }

  private plannedFromSnapshots(
    plan: PlanContext,
    weekNo: number,
    weekday: number,
  ): PlannedForDay | null {
    const w = plan.snapshotExercise as { phases?: SnapPhase[] } | null;
    const d = plan.snapshotDiet as { phases?: SnapPhase[]; target?: { calories?: number | null } } | null;
    if (!w?.phases?.length && !d?.phases?.length) return null;

    let exerciseIds: string[] = [];
    if (w?.phases?.length) {
      const phase = w.phases.find((p) => weekNo >= p.startWeek && weekNo <= p.endWeek);
      const day = phase?.days?.find((x) => x.weekday === weekday);
      if (day && !day.isRestDay) {
        exerciseIds = (day.exercises ?? []).map((e) => e.exerciseId).filter(Boolean);
      }
    }

    let mealIds: string[] = [];
    let calories: number | null = d?.target?.calories ?? null;
    if (d?.phases?.length) {
      const phase = d.phases.find((p) => weekNo >= p.startWeek && weekNo <= p.endWeek);
      const day = phase?.days?.find((x) => x.weekday === weekday);
      if (day) {
        mealIds = (day.meals ?? [])
          .filter((m) => (m.priority ?? 'PRIMARY') === 'PRIMARY')
          .map((m) => m.id)
          .filter(Boolean);
        calories = day.target?.calories ?? day.nutrition?.calories ?? calories;
      }
    }

    return { exerciseIds, mealIds, calories };
  }

  private async plannedExercisesFromTemplate(
    plan: PlanContext, weekNo: number, weekday: number,
  ): Promise<string[]> {
    if (!plan.workoutPlanId) return [];
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

  private async plannedDietFromTemplate(
    plan: PlanContext, weekNo: number, weekday: number,
  ): Promise<{ mealIds: string[]; calories: number | null }> {
    if (!plan.dietPlanId) return { mealIds: [], calories: null };
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
        meals: { where: { priority: 'PRIMARY' }, orderBy: { order: 'asc' }, select: { id: true } },
      },
    });
    return { mealIds: day?.meals.map((m) => m.id) ?? [], calories };
  }

  // ============ CRUD (هم‌راستا با schema جدید) ============

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

    const unCompletedExerciseIds = [...new Set(dto.unCompletedExerciseIds ?? [])];
    const unCompletedMealIds = [...new Set(dto.unCompletedMealIds ?? [])];
    const plannedExercises = planned.exerciseIds.length;
    const plannedMeals = planned.mealIds.length;
    // done = planned − uncompleted (کف ۰)
    const doneExercises = Math.max(0, plannedExercises - unCompletedExerciseIds.length);
    const doneMeals = Math.max(0, plannedMeals - unCompletedMealIds.length);

    if (dto.startimetAt && dto.endtimeAt && new Date(dto.endtimeAt) < new Date(dto.startimetAt)) {
      throw new BadRequestException('endtimeAt نمی‌تواند قبل از startimetAt باشد');
    }

    try {
      return await this.prisma.userLog.create({
        data: {
          userId,
          userPlanId: dto.userPlanId,
          date,
          ...this.toJalali(date),
          weightKg: dto.weightKg,

          unCompletedExerciseIds,
          plannedExercises,
          doneExercises,
          extraExercises: dto.extraExercises ?? [],
          caloriesBurned: dto.caloriesBurned,

          unCompletedMealIds,
          plannedMeals,
          doneMeals,
          extraMeals: dto.extraMeals ?? [],
          caloriesPlanned: planned.calories ?? dto.caloriesPlanned,
          caloriesConsumed: dto.caloriesConsumed,
          proteinG: dto.proteinG,
          carbsG: dto.carbsG,
          fatG: dto.fatG,

          userNote: dto.userNote,
          ...(dto.startimetAt && { startimetAt: new Date(dto.startimetAt) }),
          ...(dto.endtimeAt && { endtimeAt: new Date(dto.endtimeAt) }),
        },
      });
    } catch (e) {
      if (this.hasCode(e, 'P2002')) throw new ConflictException('برای این تاریخ قبلاً لاگ ثبت شده');
      throw e;
    }
  }

  async update(userId: string, id: string, dto: UpdateUserLogDto) {
    const existing = await this.prisma.userLog.findFirst({
      where: { id, userId },
      select: { id: true, plannedExercises: true, plannedMeals: true },
    });
    if (!existing) throw new NotFoundException('لاگ یافت نشد یا متعلق به شما نیست');

    const data: Prisma.UserLogUpdateInput = {};
    for (const key of EDITABLE_FIELDS) {
      if ((dto as any)[key] !== undefined) {
        if (key === 'startimetAt' || key === 'endtimeAt') {
          (data as any)[key] = new Date((dto as any)[key]);
        } else {
          (data as any)[key] = (dto as any)[key];
        }
      }
    }

    if (dto.unCompletedExerciseIds) {
      const ids = [...new Set(dto.unCompletedExerciseIds)];
      data.unCompletedExerciseIds = ids;
      data.doneExercises = Math.max(0, existing.plannedExercises - ids.length);
    }
    if (dto.unCompletedMealIds) {
      const ids = [...new Set(dto.unCompletedMealIds)];
      data.unCompletedMealIds = ids;
      data.doneMeals = Math.max(0, existing.plannedMeals - ids.length);
    }

    return this.prisma.userLog.update({ where: { id }, data });
  }

  async delete(userId: string, id: string) {
    const { count } = await this.prisma.userLog.deleteMany({ where: { id, userId } });
    if (!count) throw new NotFoundException('لاگ یافت نشد یا متعلق به شما نیست');
    return { success: true };
  }

  // ============ Query (User) ============

  async getByDate(userId: string, dateStr: string) {
    const date = this.normalizeDate(dateStr);
    const log = await this.prisma.userLog.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (!log) throw new NotFoundException('لاگ برای این تاریخ یافت نشد');
    return log;
  }

  async getMyLogs(userId: string, query: LogRangeQueryDto) {
    return this.listLogs({ userId }, query);
  }

  async getByPlan(userId: string, planId: string, query: LogRangeQueryDto) {
    return this.listLogs({ userId, userPlanId: planId }, query);
  }

  async getPlanSummary(planId: string) {
    return this.prisma.userLog.findMany({
      where: { userPlanId: planId },
      select: {
        unCompletedExerciseIds: true, plannedExercises: true, date: true, createdAt: true,
        unCompletedMealIds: true, plannedMeals: true
      }
    })
  }

  private async listLogs(
    baseWhere: Prisma.UserLogWhereInput,
    query: LogRangeQueryDto,
  ) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;

    const where: Prisma.UserLogWhereInput = { ...baseWhere };
    if (query.userPlanId) where.userPlanId = query.userPlanId;

    if (query.from || query.to) {
      const from = this.normalizeDate(query.from ?? query.to!);
      const to = this.normalizeDate(query.to ?? query.from!);
      this.assertRange(from, to);
      where.date = { gte: from, lte: to };
    }

    const [data, count] = await Promise.all([
      this.prisma.userLog.findMany({
        where,
        skip,
        take: limitPage,
        orderBy: this.sortOrder(query.sort),
        select: {
          id: true, date: true, weightKg: true, userPlanId: true,
          doneExercises: true, plannedExercises: true,
          doneMeals: true, plannedMeals: true,
          caloriesConsumed: true, caloriesBurned: true,
          unCompletedExerciseIds: true, unCompletedMealIds: true,
          userNote: true, coachNote: true,
          startimetAt: true, endtimeAt: true,
          jalaliYear: true, jalaliMonth: true,
        },
      }),
      this.prisma.userLog.count({ where }),
    ]);
    return { logs: data, pagination: pagination(count, page, limitPage) };
  }

  // ============ Stats (User + Coach مشترک) ============

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

  async getWeeklyStats(userId: string, fromStr: string, toStr: string) {
    const from = this.normalizeDate(fromStr);
    const to = this.normalizeDate(toStr);
    this.assertRange(from, to);

    const fromSql = this.toDateString(from);
    const toSql = this.toDateString(to);

    // هفته شمسی‌محور نیست؛ هفته شنبه→جمعه (با shift برای date_trunc)
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

  /** آمار یک سال شمسی — یک ردیف aggregate */
  async getYearlyStats(userId: string, year: number) {
    const rows = await this.prisma.$queryRaw<YearlyStatEntity[]>`
      SELECT
        jalali_year                                               AS "year",
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
      GROUP BY jalali_year
    `;
    return {
      year: rows[0] ?? {
        year,
        loggedDays: 0,
        avgWeightKg: null,
        lastWeightKg: null,
        caloriesBurned: 0,
        avgCaloriesConsumed: null,
        doneExercises: 0,
        plannedExercises: 0,
        workoutCompletion: null,
        doneMeals: 0,
        plannedMeals: 0,
        mealCompletion: null,
      },
    };
  }

  // ============ Coach ============

  private async resolveCoachId(coachUserId: string): Promise<string> {
    const coach = await this.prisma.coach.findUnique({
      where: { userId: coachUserId },
      select: { id: true },
    });
    if (!coach) throw new NotFoundException('حساب مربی یافت نشد');
    return coach.id;
  }

  /** مربی فقط شاگردی را می‌بیند که حداقل یک UserPlan با او داشته */
  private async assertCoachStudent(coachId: string, userId: string) {
    const link = await this.prisma.userPlan.findFirst({
      where: { coachId, userId },
      select: { id: true },
    });
    if (!link) throw new ForbiddenException('این کاربر شاگرد شما نیست');
  }

  async getCoachUserLogs(coachUserId: string, userId: string, query: LogRangeQueryDto) {
    const coachId = await this.resolveCoachId(coachUserId);
    await this.assertCoachStudent(coachId, userId);

    // لاگ‌های بدون plan هم اگر شاگرد باشد قابل مشاهده‌اند؛ فیلتر اختیاری روی plan مربی
    const where: Prisma.UserLogWhereInput = { userId };
    if (query.userPlanId) {
      where.userPlanId = query.userPlanId;
      where.userPlan = { coachId };
    }

    return this.listLogs(where, query);
  }

  async getCoachMonthlyStats(coachUserId: string, userId: string, year: number) {
    const coachId = await this.resolveCoachId(coachUserId);
    await this.assertCoachStudent(coachId, userId);
    return this.getMonthlyStats(userId, year);
  }

  async getCoachWeeklyStats(coachUserId: string, userId: string, from: string, to: string) {
    const coachId = await this.resolveCoachId(coachUserId);
    await this.assertCoachStudent(coachId, userId);
    return this.getWeeklyStats(userId, from, to);
  }

  async getCoachYearlyStats(coachUserId: string, userId: string, year: number) {
    const coachId = await this.resolveCoachId(coachUserId);
    await this.assertCoachStudent(coachId, userId);
    return this.getYearlyStats(userId, year);
  }

  async updateCoachNote(coachUserId: string, logId: string, coachNote: string) {
    const coachId = await this.resolveCoachId(coachUserId);

    const log = await this.prisma.userLog.findFirst({
      where: {
        id: logId,
        OR: [
          { userPlan: { coachId } },
          { user: { userPlans: { some: { coachId } } } },
        ],
      },
      select: { id: true },
    });
    if (!log) throw new NotFoundException('لاگ یافت نشد یا مربوط به شما نیست');

    return this.prisma.userLog.update({
      where: { id: logId },
      data: { coachNote },
    });
  }
}
