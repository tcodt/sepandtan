import {
  Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException,
} from '@nestjs/common';
import { toJalaali } from 'jalaali-js';
import { Prisma, RolePerson } from '../../generated/prisma/client.js';
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

  private selectorSummary() {
    return {

    }
  }


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

  /**
   * شمارش planned از فرانت؛ done = planned − uncompleted (کف ۰).
   * هیچ کوئری به UserPlan / snapshot / template زده نمی‌شود.
   */
  private computeProgress(
    planned: number | undefined,
    unCompleted: string[] | undefined,
  ): { planned: number; unCompleted: string[]; done: number } {
    const p = Math.max(0, Number(planned) || 0);
    const ids = [...new Set((unCompleted ?? []).filter(Boolean))];
    // اگر فرانت تعداد uncompleted بیشتر از planned بفرستد، done=0
    const done = Math.max(0, p - ids.length);
    return { planned: p, unCompleted: ids, done };
  }

  // ============ CRUD — مسیر داغ، حداقل کوئری ============

  async create(userId: string, dto: CreateUserLogDto) {
    const date = this.normalizeDate(dto.date);

    const ex = this.computeProgress(dto.plannedExercises, dto.unCompletedExerciseIds);
    const meal = this.computeProgress(dto.plannedMeals, dto.unCompletedMealIds);

    if (dto.startimetAt && dto.endtimeAt && new Date(dto.endtimeAt) < new Date(dto.startimetAt)) {
      throw new BadRequestException('endtimeAt نمی‌تواند قبل از startimetAt باشد');
    }

    // فقط یک INSERT. صحت userPlanId را FK دیتابیس تضمین می‌کند (P2003).
    // ownership/existence را عمداً چک نمی‌کنیم تا ترافیک بالا نشکند.
    try {
      return await this.prisma.userLog.create({
        data: {
          userId,
          userPlanId: dto.userPlanId,
          date,
          ...this.toJalali(date),
          weightKg: dto.weightKg,

          unCompletedExerciseIds: ex.unCompleted,
          plannedExercises: ex.planned,
          doneExercises: ex.done,
          extraExercises: dto.extraExercises ?? [],
          caloriesBurned: dto.caloriesBurned,

          unCompletedMealIds: meal.unCompleted,
          plannedMeals: meal.planned,
          doneMeals: meal.done,
          extraMeals: dto.extraMeals ?? [],
          caloriesPlanned: dto.caloriesPlanned,
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
      // FK نامعتبر روی userPlanId
      if (this.hasCode(e, 'P2003')) throw new BadRequestException('userPlanId نامعتبر است');
      throw e;
    }
  }

  async update(userId: string, id: string, dto: UpdateUserLogDto) {
    // یک SELECT سبک: ownership + planned + طول unCompleted فعلی
    const existing = await this.prisma.userLog.findFirst({
      where: { id, userId },
      select: {
        id: true,
        plannedExercises: true,
        plannedMeals: true,
        unCompletedExerciseIds: true,
        unCompletedMealIds: true,
      },
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

    // بازمحاسبه progress هر وقت planned یا unCompleted تغییر کند
    if (dto.plannedExercises !== undefined || dto.unCompletedExerciseIds !== undefined) {
      const planned = dto.plannedExercises !== undefined
        ? dto.plannedExercises
        : existing.plannedExercises;
      const unCompleted = dto.unCompletedExerciseIds !== undefined
        ? dto.unCompletedExerciseIds
        : existing.unCompletedExerciseIds;
      const ex = this.computeProgress(planned, unCompleted);
      data.plannedExercises = ex.planned;
      data.unCompletedExerciseIds = ex.unCompleted;
      data.doneExercises = ex.done;
    }

    if (dto.plannedMeals !== undefined || dto.unCompletedMealIds !== undefined) {
      const planned = dto.plannedMeals !== undefined
        ? dto.plannedMeals
        : existing.plannedMeals;
      const unCompleted = dto.unCompletedMealIds !== undefined
        ? dto.unCompletedMealIds
        : existing.unCompletedMealIds;
      const meal = this.computeProgress(planned, unCompleted);
      data.plannedMeals = meal.planned;
      data.unCompletedMealIds = meal.unCompleted;
      data.doneMeals = meal.done;
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

  async getPlanSummary(userId: string) {
    const getPlan = await this.prisma.userPlan.findFirst({
      where: { userId, status: 'ACTIVE' }, select: { id: true }
    })
    if (!getPlan?.id) throw new ForbiddenException('کاربر پلن فعال ندارد')
    return this.prisma.userLog.findMany({
      where: { userPlanId: getPlan.id },
      select: {
        doneExercises: true, plannedExercises: true, date: true, weightKg: true, id: true,
        doneMeals: true, plannedMeals: true, caloriesBurned: true
      }
    })
  }

  async getById(id: string) {
    return this.prisma.userLog.findUnique({
      where: { id }
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

  async getCoachUserLogs(coachUserId: string, userId: string, query: LogRangeQueryDto, role: RolePerson) {
    const coachId = await this.resolveCoachId(coachUserId);
    await this.assertCoachStudent(coachId, userId);

    // لاگ‌های بدون plan هم اگر شاگرد باشد قابل مشاهده‌اند؛ فیلتر اختیاری روی plan مربی
    const where: Prisma.UserLogWhereInput = { userId };
    if (query.userPlanId) {
      where.userPlanId = query.userPlanId;
      if (role === 'COACH') where.userPlan = { coachId }
    }

    return this.listLogs(where, query);
  }

  async getCoachMonthlyStats(coachUserId: string, userId: string, year: number, role: RolePerson) {
    const coachId = await this.resolveCoachId(coachUserId);
    if (role === 'COACH') {
      await this.assertCoachStudent(coachId, userId);
    }
    return this.getMonthlyStats(userId, year);
  }

  async getCoachWeeklyStats(coachUserId: string, userId: string, from: string, to: string, role: RolePerson) {
    const coachId = await this.resolveCoachId(coachUserId);
    if (role === 'COACH') {
      await this.assertCoachStudent(coachId, userId);
    }
    return this.getWeeklyStats(userId, from, to);
  }

  async getCoachYearlyStats(coachUserId: string, userId: string, year: number, role: RolePerson) {
    const coachId = await this.resolveCoachId(coachUserId);
    if (role === 'COACH') {
      await this.assertCoachStudent(coachId, userId);
    }
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
