import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import { OrderDirection } from '../../common/dtos/query.defualt.dto.js';
import {
  ActivateUserPlanDto, UpdateWorkoutSnapshotDto, UpdateDietSnapshotDto,
  UpdatePlanDatesDto, UserPlanQueryDto, PartQueryDto,
} from './dto/user-plan.dto.js';
import {
  tehranToday, toDateString, addDays, toJson, toNum, buildWorkoutSnapshot, buildDietSnapshot,
  collectExerciseIds, collectFoodIds, resolvePlanWeek, phaseOutline, parseDateOnly, DAY_MS,
  type WorkoutSnapshot, type DietSnapshot, type WorkoutInput, type DietInput, weekdayOf,
  type ExerciseLite, type FoodLite,
} from './util/plan-snapshot.util.js';

const MAX_LIMIT = 100;
const MAX_START_AHEAD_DAYS = 60;
const MAX_BACKDATE_DAYS = 14; // حداکثر عقب بردن شروعِ برنامه‌ی فعال
const EDITABLE = ['DRAFT', 'ACTIVE'] as const;

type PartDay = {
  weekday: number;
  isRestDay?: boolean;
  exercises?: unknown[];
  meals?: { priority: string }[];
};
type PartPhase = { title: string; startWeek: number; endWeek: number; days: PartDay[] };
type DayLog = { planned: number; done: number; uncompletedIds: string[] };
type CalendarEntry = {
  date: string; week: number; weekday: number;
  status: 'DONE' | 'PARTIAL' | 'MISSED' | 'PENDING' | 'EXTRA';
  planned: number; done: number; uncompletedIds: string[];
  isRestDay: boolean;
};
type PhaseView = {
  planned: number;
  done: number;
  /** تعداد روزهای تمرینی فاز (بدون استراحت) — برای کل طول فاز */
  allDays: number;
  /** تعداد روزهایی که لاگ دارند (روز استراحتِ بدون لاگ شمرده نمی‌شود) */
  logDays: number;
  calendar: CalendarEntry[];
};

const minDate = (a: Date, b: Date | null) => (b && b < a ? b : a);
const maxDate = (a: Date, b: Date) => (a > b ? a : b);
type PartKey = 'workout' | 'diet';

@Injectable()
export class UserPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  // ───────── helpers ─────────

  private getLimit(limit?: number) {
    const def = Number(this.configService.get('limit.userPlan')) || 10;
    return Math.min(MAX_LIMIT, Math.max(1, Number(limit) || def)); // سقف برای جلوگیری از DoS
  }

  private paging(query: UserPlanQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = this.getLimit(query.limit);
    return {
      page,
      limit,
      skip: (page - 1) * limit,
      orderBy: { createdAt: query.order === OrderDirection.ASC ? ('asc' as const) : ('desc' as const) },
    };
  }

  private dates<T extends { startDate: Date | null; endDate: Date | null }>(p: T) {
    return {
      ...p,
      startDate: p.startDate ? toDateString(p.startDate) : null,
      endDate: p.endDate ? toDateString(p.endDate) : null,
    };
  }

  private isUniqueViolation(e: unknown) {
    return (e as { code?: string })?.code === 'P2002';
  }

  private listSelect() {
    return {
      id: true, title: true, type: true, status: true, source: true,
      startDate: true, endDate: true, activatedAt: true, createdAt: true,
      workoutPlanId: true, dietPlanId: true, coachId: true,
    } as const;
  }

  // ───────── template loaders ─────────

  private async loadWorkoutTemplateInput(templateId: string): Promise<{ title: string; input: WorkoutInput }> {
    const plan = await this.prisma.workoutPlan.findUnique({
      where: { id: templateId },
      select: {
        title: true,
        workoutPhases: {
          orderBy: { order: 'asc' },
          select: {
            title: true, startWeek: true, endWeek: true,
            days: {
              select: {
                weekday: true, title: true, isRestDay: true, notes: true,
                exercises: {
                  orderBy: { order: 'asc' },
                  select: { exerciseId: true, order: true, sets: true, reps: true, durationSec: true, restSec: true, notes: true },
                },
              },
            },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('قالب ورزشی یافت نشد');
    return { title: plan.title, input: { phases: plan.workoutPhases } };
  }

  private async loadDietTemplateInput(templateId: string): Promise<{ title: string; input: DietInput }> {
    const plan = await this.prisma.dietPlan.findUnique({
      where: { id: templateId },
      select: {
        title: true, targetCalories: true, targetProteinG: true, targetCarbsG: true, targetFatG: true,
        dietPhases: {
          orderBy: { order: 'asc' },
          select: {
            title: true, startWeek: true, endWeek: true,
            targetCalories: true, targetProteinG: true, targetCarbsG: true, targetFatG: true,
            days: {
              select: {
                weekday: true, title: true, notes: true,
                meals: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true, type: true, priority: true, order: true, notes: true,
                    items: { select: { foodId: true, quantityGrams: true, notes: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('قالب غذایی یافت نشد');
    return {
      title: plan.title,
      input: {
        targetCalories: plan.targetCalories, targetProteinG: plan.targetProteinG,
        targetCarbsG: plan.targetCarbsG, targetFatG: plan.targetFatG,
        phases: plan.dietPhases.map((p) => ({
          ...p,
          days: p.days.map((d) => ({
            ...d,
            meals: d.meals.map((m) => ({
              ...m,
              items: m.items.map((i) => ({ ...i, quantityGrams: toNum(i.quantityGrams) })),
            })),
          })),
        })),
      },
    };
  }

  /** onlyActive=false برای ساخت از قالب: snapshot تاریخی است و حرکتِ غیرفعال‌شده‌ی بعدی نباید ساخت را بشکند */
  private async resolveExercisesMap(ids: string[], onlyActive = true): Promise<Map<string, ExerciseLite>> {
    if (!ids.length) return new Map();
    const rows = await this.prisma.exercise.findMany({
      where: { id: { in: ids }, ...(onlyActive && { isActive: true }) },
      select: { id: true, title: true, coverImg: true },
    });
    return new Map(rows.map((r) => [r.id, { title: r.title, cover: r.coverImg }]));
  }

  private async resolveFoodsMap(ids: string[], onlyActive = true): Promise<Map<string, FoodLite>> {
    if (!ids.length) return new Map();
    const rows = await this.prisma.food.findMany({
      where: { id: { in: ids }, ...(onlyActive && { isActive: true }) },
      select: { id: true, name: true, caloriesPer100g: true, proteinPer100g: true, carbsPer100g: true, fatPer100g: true },
    });
    return new Map(rows.map((r) => [r.id, {
      name: r.name,
      caloriesPer100g: toNum(r.caloriesPer100g),
      proteinPer100g: toNum(r.proteinPer100g),
      carbsPer100g: toNum(r.carbsPer100g),
      fatPer100g: toNum(r.fatPer100g),
    }]));
  }

  private async buildWorkoutFromTemplate(templateId: string): Promise<WorkoutSnapshot> {
    const { title, input } = await this.loadWorkoutTemplateInput(templateId);
    const map = await this.resolveExercisesMap(collectExerciseIds(input), false);
    return buildWorkoutSnapshot(input, { templateId, title }, map);
  }

  private async buildDietFromTemplate(templateId: string): Promise<DietSnapshot> {
    const { title, input } = await this.loadDietTemplateInput(templateId);
    const map = await this.resolveFoodsMap(collectFoodIds(input), false);
    return buildDietSnapshot(input, { templateId, title }, map);
  }

  // ═════════ Admin ═════════

  async getPlansAdmin(query: UserPlanQueryDto) {
    const { page, limit, skip, orderBy } = this.paging(query);
    const where = query.status ? { status: query.status } : {}; // ادمین همه‌چیز را می‌بیند

    const [data, count] = await Promise.all([
      this.prisma.userPlan.findMany({
        where, skip, take: limit, orderBy,
        select: {
          ...this.listSelect(),
          coach: { select: { id: true, title: true, slug: true, userId: true } },
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.userPlan.count({ where }),
    ]);
    return { plans: data.map((p) => this.dates(p)), pagination: pagination(count, page, limit) };
  }

  /**
   * UserLog.userPlanId و CoachReview.userPlanId هر دو onDelete: SetNull هستند؛
   * پس حذف برنامه تاریخچه‌ی وزن/لاگ کاربر را از بین نمی‌برد و یک کوئری کافی است.
   */
  async deletePlansAdmin(id: string) {
    const { count } = await this.prisma.userPlan.deleteMany({ where: { id } });
    if (!count) throw new NotFoundException('برنامه یافت نشد');
    return { id, deleted: true as const };
  }

  // ═════════ User ═════════

  async getMyPlans(userId: string, query: UserPlanQueryDto) {
    const { page, limit, skip, orderBy } = this.paging(query);
    const where = {
      userId,
      ...(query.status ? { status: query.status } : { status: { not: 'DRAFT' as const } }),
    };

    const [data, count] = await Promise.all([
      this.prisma.userPlan.findMany({
        where, skip, take: limit, orderBy,
        select: { ...this.listSelect(), coach: { select: { id: true, title: true, slug: true } } },
      }),
      this.prisma.userPlan.count({ where }),
    ]);
    return { plans: data.map((p) => this.dates(p)), pagination: pagination(count, page, limit) };
  }

  /** فقط ستون‌های سبک؛ هیچ snapshotی خوانده نمی‌شود */
  async getMyCurrent(userId: string) {
    const today = tehranToday();
    const plan = await this.prisma.userPlan.findFirst({
      where: { userId, status: 'ACTIVE', OR: [{ endDate: null }, { endDate: { gte: today } }] },
      select: {
        id: true, title: true, type: true, status: true, source: true,
        startDate: true, endDate: true, activatedAt: true,
        workoutWeeks: true, dietWeeks: true, dietStartDate: true,
        coach: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!plan) return { plan: null };

    const hasWorkout = plan.type === 'WORKOUT' || plan.type === 'ALL';
    const hasDiet = plan.type === 'DIET' || plan.type === 'ALL';
    const dietStart = plan.dietStartDate ?? plan.startDate;
    const workoutWeek = hasWorkout && plan.startDate ? resolvePlanWeek(plan.startDate, today, plan.workoutWeeks) : null;
    const dietWeek = hasDiet && dietStart ? resolvePlanWeek(dietStart, today, plan.dietWeeks) : null;

    return {
      plan: {
        id: plan.id, title: plan.title, type: plan.type, status: plan.status, source: plan.source,
        startDate: plan.startDate ? toDateString(plan.startDate) : null,
        endDate: plan.endDate ? toDateString(plan.endDate) : null,
        activatedAt: plan.activatedAt,
        coach: plan.coach,
        hasWorkout, hasDiet,
        currentWeek: workoutWeek ?? dietWeek, // سازگاری با فرانت فعلی
        workoutWeek, dietWeek,
        isStarted: !!plan.startDate && plan.startDate <= today,
        isExpired: !!plan.endDate && plan.endDate < today,
        workoutDurationWeeks: plan.workoutWeeks,
        dietDurationWeeks: plan.dietWeeks,
      },
    };
  }

  // ═════════ هفته/فاز یک پلن (کاربر، مربی، ادمین) ═════════

  /** فقط ستون snapshotِ همان بخش خوانده می‌شود، نه هر دو */
  private async loadPart(planId: string, part: PartKey) {
    const base = { id: true, type: true, status: true, startDate: true, endDate: true, dietStartDate: true } as const;
    if (part === 'workout') {
      const p = await this.prisma.userPlan.findUnique({ where: { id: planId }, select: { ...base, snapshotExercise: true } });
      if (!p) return null;
      const { snapshotExercise, ...meta } = p;
      return { meta, snap: snapshotExercise as WorkoutSnapshot | null };
    }
    const p = await this.prisma.userPlan.findUnique({ where: { id: planId }, select: { ...base, snapshotDiet: true } });
    if (!p) return null;
    const { snapshotDiet, ...meta } = p;
    return { meta, snap: snapshotDiet as DietSnapshot | null };
  }
  private scheduledByWeekday(phase: PartPhase, part: PartKey) {
    const m = new Map<number, { planned: number; isRestDay: boolean }>();
    for (const d of phase.days) {
      const isRest = !!d.isRestDay;
      const planned = part === 'workout'
        ? (isRest ? 0 : d.exercises?.length ?? 0)
        : (d.meals ?? []).filter((x) => x.priority === 'PRIMARY').length;
      m.set(d.weekday, { planned, isRestDay: isRest });
    }
    return m;
  }

  /**
   * تعداد روزهای تمرینی قالبِ فاز (بدون استراحت) × تعداد هفته‌های فاز.
   * مثال: ۲ روز تمرین در هفته × ۲ هفته = allDays=4
   */
  private countAllTrainingDays(phase: PartPhase, part: PartKey): number {
    const weeks = Math.max(0, phase.endWeek - phase.startWeek + 1);
    let perWeek = 0;
    for (const d of phase.days) {
      if (d.isRestDay) continue;
      if (part === 'workout') {
        if ((d.exercises?.length ?? 0) > 0) perWeek += 1;
      } else {
        if ((d.meals ?? []).some((x) => x.priority === 'PRIMARY')) perWeek += 1;
      }
    }
    return weeks * perWeek;
  }

  /**
   * تقویم و پیشرفت یک فاز.
   * - بازهٔ تقویم = کل روزهای فاز (نه فقط تا امروز) تا لاگِ فردا/آینده هم دیده شود
   * - جمع planned/done فقط تا امروز (آینده‌ی بدون لاگ MISSED نمی‌شود)
   * - allDays = روزهای تمرینی فاز (بدون استراحت)
   * - logDays = تعداد روزهایی که لاگ دارند و روز استراحتِ خالی نیستند
   */
  private phaseLogView(
    p: PartPhase, part: PartKey, start: Date, planEnd: Date | null, today: Date,
    logs: Map<string, DayLog>, withCalendar: boolean,
  ): PhaseView {
    const sched = this.scheduledByWeekday(p, part);
    const from = addDays(start, (p.startWeek - 1) * 7);
    const phaseEnd = addDays(start, p.endWeek * 7 - 1);
    const rangeEnd = minDate(phaseEnd, planEnd);

    // اگر لاگی بعد از today داخل فاز هست، تقویم تا همان‌جا هم برود
    let to = rangeEnd;
    for (const key of logs.keys()) {
      const ld = parseDateOnly(key);
      if (ld >= from && ld <= rangeEnd && ld > to) to = ld;
    }

    let planned = 0;
    let done = 0;
    let logDays = 0;
    const calendar: CalendarEntry[] = [];

    for (let d = from; d <= to; d = addDays(d, 1)) {
      const wd = weekdayOf(d); // ۰=شنبه … ۶=جمعه (مطلقِ تقویم، نه «روزِ Nام فاز»)
      const dateStr = toDateString(d);
      const log = logs.get(dateStr);
      const slot = sched.get(wd);
      const s = slot?.planned ?? 0;
      const isRestDay = slot?.isRestDay ?? false;

      // لاگ تاریخی روی planned اولویت دارد
      const dayPlanned = log ? (log.planned || s) : s;
      const dayDone = log ? log.done : 0;

      // جمع پیشرفت فقط تا امروز؛ آینده‌ی بدون لاگ را MISSED حساب نکن
      if (log || d <= today) {
        if (!isRestDay || dayPlanned > 0 || log) {
          planned += dayPlanned;
          done += dayDone;
        }
      }

      if (log && (!isRestDay || dayPlanned > 0 || dayDone > 0)) {
        logDays += 1;
      }

      // تقویم: روز تمرینی قالب یا هر روزی که لاگ دارد — استراحتِ بدون لاگ حذف
      if (withCalendar) {
        const isTrainingSlot = !!slot && !isRestDay;
        if (!log && !isTrainingSlot) continue;

        calendar.push({
          date: dateStr,
          week: Math.floor((d.getTime() - start.getTime()) / DAY_MS / 7) + 1,
          weekday: wd,
          status: log
            ? (dayPlanned === 0 ? 'EXTRA' : dayDone >= dayPlanned ? 'DONE' : 'PARTIAL')
            : (d < today ? 'MISSED' : 'PENDING'),
          planned: dayPlanned,
          done: dayDone,
          uncompletedIds: log?.uncompletedIds ?? [],
          isRestDay,
        });
      }
    }

    return {
      planned,
      done,
      allDays: this.countAllTrainingDays(p, part),
      logDays,
      calendar,
    };
  }

  async getPlanPart(planId: string, part: PartKey, query: PartQueryDto) {
    // دو query موازی؛ برنامه و لاگ‌ها (بدون round-trip پشت‌سرهم)
    const [loaded, logs] = await Promise.all([this.loadPart(planId, part), this.loadLogs(planId, part)]);
    if (!loaded) throw new NotFoundException('برنامه یافت نشد');
    const { meta, snap } = loaded;

    if (part === 'workout' && meta.type === 'DIET') throw new BadRequestException('این برنامه بخش ورزشی ندارد');
    if (part === 'diet' && meta.type === 'WORKOUT') throw new BadRequestException('این برنامه بخش غذایی ندارد');
    if (!snap?.phases?.length) throw new NotFoundException('snapshot یافت نشد');

    const today = tehranToday();
    const start = part === 'workout' ? meta.startDate : (meta.dietStartDate ?? meta.startDate);
    const isStarted = !!start && start <= today;
    const currentWeek = resolvePlanWeek(start, today, snap.durationWeeks);

    const phases = [...(snap.phases as unknown as PartPhase[])].sort((a, b) => a.startWeek - b.startWeek);

    let idx: number;
    if (query.phase != null) {
      idx = query.phase - 1;
      if (!phases[idx]) throw new NotFoundException(`فاز ${query.phase} یافت نشد`);
    } else {
      idx = phases.findIndex((p) => currentWeek >= p.startWeek && currentWeek <= p.endWeek);
    }
    const phase = idx >= 0 ? phases[idx] : null;

    // قبل از شروع برنامه → view خالی
    const view = (p: PartPhase, withCalendar: boolean): PhaseView =>
      start
        ? this.phaseLogView(p, part, start, meta.endDate, today, logs, withCalendar)
        : { planned: 0, done: 0, allDays: this.countAllTrainingDays(p, part), logDays: 0, calendar: [] };

    let totalPlanned = 0;
    let totalDone = 0;
    let totalAllDays = 0;
    let totalLogDays = 0;
    const outline = phases.map((p, i) => {
      const v = view(p, i === idx); // تقویم فقط برای فاز انتخاب‌شده
      totalPlanned += v.planned;
      totalDone += v.done;
      totalAllDays += v.allDays;
      totalLogDays += v.logDays;
      return {
        phaseNumber: i + 1,
        title: p.title,
        startWeek: p.startWeek,
        endWeek: p.endWeek,
        isCurrent: isStarted && currentWeek >= p.startWeek && currentWeek <= p.endWeek,
        isSelected: i === idx,
        summary: {
          planned: v.planned,
          done: v.done,
          allDays: v.allDays,
          logDays: v.logDays,
        },
        calendar: v.calendar,
      };
    });

    const selected = idx >= 0 ? outline[idx] : null;

    return {
      planId: meta.id,
      part,
      status: meta.status,
      isStarted,
      currentWeek,
      requestedWeek: phase ? phase.startWeek : currentWeek,
      phaseNumber: phase ? idx + 1 : null,
      weekInPhase: phase && isStarted && currentWeek >= phase.startWeek && currentWeek <= phase.endWeek
        ? currentWeek - phase.startWeek + 1 : null,
      durationWeeks: snap.durationWeeks,
      startDate: start ? toDateString(start) : null,
      summary: {
        planned: totalPlanned,
        done: totalDone,
        allDays: totalAllDays,
        logDays: totalLogDays,
      },
      // calendar را از outline بیرون می‌کشیم تا فقط داخل phase بیاید
      outline: outline.map(({ calendar, ...o }) => o),
      phase: phase && selected ? {
        phaseNumber: selected.phaseNumber,
        title: phase.title,
        startWeek: phase.startWeek,
        endWeek: phase.endWeek,
        days: phase.days,
        summary: selected.summary,
        calendar: selected.calendar,
      } : null,
    };
  }

  private async loadLogs(planId: string, part: PartKey): Promise<Map<string, DayLog>> {
    const where = { userPlanId: planId };
    const rows: [string, DayLog][] =
      part === 'workout'
        ? (await this.prisma.userLog.findMany({
          where,
          select: { date: true, plannedExercises: true, doneExercises: true, unCompletedExerciseIds: true },
        })).map((r) => [toDateString(r.date), {
          planned: r.plannedExercises, done: r.doneExercises, uncompletedIds: r.unCompletedExerciseIds,
        }] as [string, DayLog])
        : (await this.prisma.userLog.findMany({
          where,
          select: { date: true, plannedMeals: true, doneMeals: true, unCompletedMealIds: true },
        })).map((r) => [toDateString(r.date), {
          planned: r.plannedMeals, done: r.doneMeals, uncompletedIds: r.unCompletedMealIds,
        }] as [string, DayLog]);
    return new Map(rows);
  }


  // ═════════ Coach ═════════

  async getCoachPlans(coachUserId: string, query: UserPlanQueryDto) {
    const { page, limit, skip, orderBy } = this.paging(query);
    const where = {
      coach: { userId: coachUserId }, // بدون کوئری جدا برای resolveCoachId
      ...(query.status && query.status !== undefined && { status: query.status }),
    };

    const [data, count] = await Promise.all([
      this.prisma.userPlan.findMany({
        where, skip, take: limit, orderBy,
        select: {
          ...this.listSelect(), requestId: true,
          user: { select: { id: true, name: true, avatar: true } }
        }
      }),
      this.prisma.userPlan.count({ where })
    ]);
    return { plans: data.map((p) => this.dates(p)), pagination: pagination(count, page, limit) };
  }

  async createDraft(coachUserId: string, requestId: string) {
    const existingWhere = { requestId, coach: { userId: coachUserId }, status: { in: ['DRAFT', 'ACTIVE'] as ('DRAFT' | 'ACTIVE')[] } };
    const existingSelect = { id: true, status: true, type: true } as const;

    const existing = await this.prisma.userPlan.findFirst({ where: existingWhere, select: existingSelect });
    if (existing) return { ...existing, created: false };

    const req = await this.prisma.planRequest.findFirst({
      where: { id: requestId, status: 'PAID', coach: { userId: coachUserId } },
      select: { id: true, userId: true, coachId: true, workoutTemplateId: true, dietTemplateId: true },
    });
    if (!req) throw new NotFoundException('درخواست پرداخت‌شده یافت نشد (فقط وضعیت PAID قابل ساخت پیش‌نویس است)');
    if (!req.workoutTemplateId && !req.dietTemplateId) throw new BadRequestException('درخواست فاقد قالب برنامه است');

    // دو snapshot هم‌زمان ساخته می‌شوند. «غذاییِ تنها» هم DRAFT می‌شود و در activate merge می‌شود.
    const [snapshotExercise, snapshotDiet] = await Promise.all([
      req.workoutTemplateId ? this.buildWorkoutFromTemplate(req.workoutTemplateId) : null,
      req.dietTemplateId ? this.buildDietFromTemplate(req.dietTemplateId) : null,
    ]);
    const type = snapshotExercise && snapshotDiet ? 'ALL' : snapshotExercise ? 'WORKOUT' : 'DIET';
    const title = [snapshotExercise?.title, snapshotDiet?.title].filter(Boolean).join(' + ') || 'برنامه اختصاصی';

    try {
      const plan = await this.prisma.userPlan.create({
        data: {
          userId: req.userId, coachId: req.coachId, requestId: req.id,
          workoutPlanId: req.workoutTemplateId, dietPlanId: req.dietTemplateId,
          title, status: 'DRAFT', source: 'COACH', type,
          // ⚠️ null برای ستون Json? در Prisma خطا می‌دهد؛ undefined = NULL دیتابیس
          snapshotExercise: snapshotExercise ? toJson(snapshotExercise) : undefined,
          snapshotDiet: snapshotDiet ? toJson(snapshotDiet) : undefined,
          workoutWeeks: snapshotExercise?.durationWeeks,
          dietWeeks: snapshotDiet?.durationWeeks,
        },
        select: existingSelect,
      });
      return { ...plan, created: true };
    } catch (e) {
      // ایندکس یکتای partial: درخواست هم‌زمان دیگری پیش‌نویس را ساخته است
      if (!this.isUniqueViolation(e)) throw e;
      const again = await this.prisma.userPlan.findFirst({ where: existingWhere, select: existingSelect });
      if (again) return { ...again, created: false };
      throw e;
    }
  }

  async getCoachPlan(coachUserId: string, id: string) {
    const plan = await this.prisma.userPlan.findFirst({
      where: { id, coach: { userId: coachUserId } },
      select: {
        id: true, title: true, status: true, type: true, startDate: true, endDate: true,
        snapshotExercise: true, snapshotDiet: true, // سنگین ولی عمداً: صفحه‌ی ویرایش
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد');

    const w = plan.snapshotExercise as WorkoutSnapshot | null;
    const d = plan.snapshotDiet as DietSnapshot | null;
    return {
      ...this.dates(plan),
      workoutOutline: w?.phases ? phaseOutline(w.phases) : [],
      dietOutline: d?.phases ? phaseOutline(d.phases) : [],
    };
  }

  async updateWorkoutSnapshot(coachUserId: string, id: string, dto: UpdateWorkoutSnapshotDto) {
    const plan = await this.prisma.userPlan.findFirst({
      where: { id, coach: { userId: coachUserId } },
      select: { status: true, type: true, snapshotExercise: true },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد');
    if (!EDITABLE.includes(plan.status as (typeof EDITABLE)[number])) throw new ConflictException('فقط پیش‌نویس یا برنامه‌ی فعال قابل ویرایش است');
    if (plan.type === 'DIET') throw new BadRequestException('این برنامه بخش ورزشی ندارد');

    const prev = plan.snapshotExercise as WorkoutSnapshot | null;
    const map = await this.resolveExercisesMap(collectExerciseIds(dto.workout)); // ویرایش دستی: فقط حرکات فعال
    const built = buildWorkoutSnapshot(
      dto.workout,
      { templateId: prev?.templateId ?? null, title: prev?.title ?? 'برنامه ورزشی' },
      map,
    );

    await this.prisma.userPlan.update({
      where: { id },
      data: { snapshotExercise: toJson(built), workoutWeeks: built.durationWeeks },
    });
    return { id, updated: true };
  }

  async updateDietSnapshot(coachUserId: string, id: string, dto: UpdateDietSnapshotDto) {
    const plan = await this.prisma.userPlan.findFirst({
      where: { id, coach: { userId: coachUserId } },
      select: { status: true, type: true, snapshotDiet: true },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد');
    if (!EDITABLE.includes(plan.status as (typeof EDITABLE)[number])) throw new ConflictException('فقط پیش‌نویس یا برنامه‌ی فعال قابل ویرایش است');
    if (plan.type === 'WORKOUT') throw new BadRequestException('این برنامه بخش غذایی ندارد');

    const prev = plan.snapshotDiet as DietSnapshot | null;
    const map = await this.resolveFoodsMap(collectFoodIds(dto.diet));
    const built = buildDietSnapshot(
      dto.diet,
      { templateId: prev?.templateId ?? null, title: prev?.title ?? 'برنامه غذایی' },
      map,
    );
    if (prev?.startDate) built.startDate = prev.startDate; // سازگاری؛ منبع اصلی ستون dietStartDate است

    await this.prisma.userPlan.update({
      where: { id },
      data: { snapshotDiet: toJson(built), dietWeeks: built.durationWeeks },
    });
    return { id, updated: true };
  }

  // ═════════ فعال‌سازی ═════════

  async activate(coachUserId: string, id: string, dto: ActivateUserPlanDto) {
    const today = tehranToday();
    const start = dto.startDate ? parseDateOnly(dto.startDate) : today;
    if (start < today) throw new BadRequestException('تاریخ شروع نمی‌تواند گذشته باشد');
    if (start > addDays(today, MAX_START_AHEAD_DAYS)) throw new BadRequestException('تاریخ شروع حداکثر ۶۰ روز بعد مجاز است');
    console.log(coachUserId);

    // بدون snapshot: طول برنامه از ستون‌های سبک می‌آید
    const plan = await this.prisma.userPlan.findFirst({
      where: { id, coach: { userId: coachUserId } },
      select: { id: true, userId: true, status: true, type: true, requestId: true, workoutWeeks: true, dietWeeks: true },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد');
    if (plan.status !== 'DRAFT') throw new ConflictException('فقط پیش‌نویس قابل فعال‌سازی است');

    const durationWeeks = Math.max(plan.workoutWeeks ?? 0, plan.dietWeeks ?? 0, 1);
    let endDate: Date;
    if (dto.endDate) {
      endDate = parseDateOnly(dto.endDate);
      if (endDate < start) throw new BadRequestException('تاریخ پایان نمی‌تواند قبل از شروع باشد');
    } else {
      endDate = addDays(start, durationWeeks * 7 - 1);
    }

    try {
      return plan.type === 'DIET'
        ? await this.activateDietOnly(plan, start, endDate, today)
        : await this.activateFull(plan, start, endDate, today);
    } catch (e) {
      // ایندکس یکتای «یک ACTIVE برای هر کاربر» در رقابت هم‌زمان
      if (this.isUniqueViolation(e)) throw new ConflictException('کاربر هم‌اکنون برنامه‌ی فعال دارد');
      throw e;
    }
  }

  private activateFull(
    plan: { id: string; userId: string; type: string; requestId: string | null },
    start: Date, endDate: Date, today: Date,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // ACTIVEهای منقضی‌شده (cron هنوز نبسته) بسته می‌شوند
      await tx.userPlan.updateMany({
        where: { userId: plan.userId, status: 'ACTIVE', endDate: { lt: today } },
        data: { status: 'COMPLETED' },
      });
      const conflict = await tx.userPlan.count({ where: { userId: plan.userId, status: 'ACTIVE' } });
      if (conflict > 0) throw new ConflictException('کاربر هم‌اکنون برنامه‌ی فعال دارد؛ ابتدا آن را تکمیل/لغو کنید');

      // claim شرطی: فقط یک درخواست هم‌زمان برنده می‌شود
      const { count } = await tx.userPlan.updateMany({
        where: { id: plan.id, status: 'DRAFT' },
        data: { status: 'ACTIVE', startDate: start, endDate, activatedAt: new Date() },
      });
      if (!count) throw new ConflictException('وضعیت برنامه هم‌زمان تغییر کرد');

      if (plan.requestId) {
        await tx.planRequest.updateMany({ where: { id: plan.requestId, status: 'PAID' }, data: { status: 'DELIVERED' } });
      }
      return { id: plan.id, status: 'ACTIVE' as const, type: plan.type, startDate: toDateString(start), endDate: toDateString(endDate) };
    });
  }

  /** غذاییِ تنها: snapshot روی پلن ورزشیِ فعال merge می‌شود */
  private activateDietOnly(
    plan: { id: string; userId: string; requestId: string | null; dietWeeks: number | null },
    start: Date, endDate: Date, today: Date,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // ۱) claim پیش‌نویس (دوبار کلیک / هم‌زمانی)
      const claimed = await tx.userPlan.updateMany({
        where: { id: plan.id, status: 'DRAFT' },
        data: { status: 'COMPLETED', startDate: start, endDate, activatedAt: new Date() },
      });
      if (!claimed.count) throw new ConflictException('وضعیت برنامه هم‌زمان تغییر کرد');

      // ۲) پلن ورزشیِ فعال
      const active = await tx.userPlan.findFirst({
        where: { userId: plan.userId, status: 'ACTIVE', OR: [{ endDate: null }, { endDate: { gte: today } }] },
        select: { id: true, type: true, endDate: true },
      });
      if (!active) throw new ConflictException('کاربر برنامه‌ی ورزشی فعال ندارد؛ ابتدا برنامه‌ی ورزشی را تحویل دهید');
      if (active.type !== 'WORKOUT') throw new ConflictException('کاربر هم‌اکنون برنامه‌ی غذایی فعال دارد');

      // ۳) snapshot فقط همین‌جا خوانده می‌شود
      const draft = await tx.userPlan.findUnique({ where: { id: plan.id }, select: { snapshotDiet: true } });
      const dSnap = draft?.snapshotDiet as DietSnapshot | null;
      if (!dSnap) throw new BadRequestException('snapshot غذایی خالی است');

      // ۴) merge شرطی؛ اگر هم‌زمان merge دیگری انجام شده باشد count = 0
      const merged = await tx.userPlan.updateMany({
        where: { id: active.id, type: 'WORKOUT', status: 'ACTIVE' },
        data: {
          type: 'ALL',
          snapshotDiet: toJson({ ...dSnap, startDate: toDateString(start) }),
          dietWeeks: plan.dietWeeks,
          dietStartDate: start,
          endDate: !active.endDate || endDate > active.endDate ? endDate : active.endDate,
        },
      });
      if (!merged.count) throw new ConflictException('برنامه‌ی فعال هم‌زمان تغییر کرد');

      if (plan.requestId) {
        await tx.planRequest.updateMany({ where: { id: plan.requestId, status: 'PAID' }, data: { status: 'DELIVERED' } });
      }
      return {
        id: active.id, status: 'ACTIVE' as const, type: 'ALL',
        startDate: toDateString(start), endDate: toDateString(endDate),
      };
    });
  }

  // ═════════ تغییر تاریخ / لغو ═════════

  async updateDates(coachUserId: string, id: string, dto: UpdatePlanDatesDto) {
    if (!dto.startDate && !dto.endDate) throw new BadRequestException('حداقل یکی از startDate یا endDate را بفرستید');

    const plan = await this.prisma.userPlan.findFirst({
      where: { id, coach: { userId: coachUserId } },
      select: { status: true, startDate: true, endDate: true },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد');
    // تاریخ DRAFT هنگام activate تعیین می‌شود
    if (plan.status !== 'ACTIVE' || !plan.startDate || !plan.endDate) {
      throw new ConflictException('فقط تاریخ برنامه‌ی فعال قابل تغییر است');
    }

    const today = tehranToday();
    let start = plan.startDate;
    let end = plan.endDate;

    if (dto.startDate) {
      start = parseDateOnly(dto.startDate);
      if (start < addDays(today, -MAX_BACKDATE_DAYS)) throw new BadRequestException(`تاریخ شروع حداکثر ${MAX_BACKDATE_DAYS} روز قبل مجاز است`);
      if (start > addDays(today, MAX_START_AHEAD_DAYS)) throw new BadRequestException('تاریخ شروع حداکثر ۶۰ روز بعد مجاز است');
      // فقط شروع عوض شد → طول برنامه حفظ شود
      if (!dto.endDate) end = addDays(start, Math.round((plan.endDate.getTime() - plan.startDate.getTime()) / DAY_MS));
    }
    if (dto.endDate) end = parseDateOnly(dto.endDate);

    if (end < start) throw new BadRequestException('تاریخ پایان نمی‌تواند قبل از شروع باشد');
    if (end < today) throw new BadRequestException('تاریخ پایان نمی‌تواند گذشته باشد (برای پایان‌دادن از لغو استفاده کنید)');

    const { count } = await this.prisma.userPlan.updateMany({
      where: { id, status: 'ACTIVE' }, // اگر هم‌زمان بسته شد، اعمال نشود
      data: { startDate: start, endDate: end },
    });
    if (!count) throw new ConflictException('وضعیت برنامه هم‌زمان تغییر کرد');
    return { id, startDate: toDateString(start), endDate: toDateString(end) };
  }

  async cancel(coachUserId: string, id: string) {
    const { count } = await this.prisma.userPlan.updateMany({
      where: { id, coach: { userId: coachUserId }, status: { in: [...EDITABLE] } },
      data: { status: 'CANCELLED' },
    });
    if (count) return { id, status: 'CANCELLED' as const };

    const p = await this.prisma.userPlan.findFirst({
      where: { id, coach: { userId: coachUserId } },
      select: { status: true },
    });
    if (!p) throw new NotFoundException('برنامه یافت نشد');
    throw new ConflictException(`برنامه در وضعیت ${p.status} قابل لغو نیست`);
  }
}