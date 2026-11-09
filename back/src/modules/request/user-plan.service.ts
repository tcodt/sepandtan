import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import {
  ActivateUserPlanDto,
  UpdateUserPlanSnapshotDto,
  UserPlanQueryDto,
} from './dto/user-plan.dto.js';
import {
  tehranToday,
  toDateString,
  addDays,
  parseDateOnly,
  weekdayOf,
  toJson,
  toNum,
  buildWorkoutSnapshot,
  buildDietSnapshot,
  collectExerciseIds,
  collectFoodIds,
  type WorkoutSnapshot,
  type DietSnapshot,
  type WorkoutInput,
  type DietInput,
  type ExerciseLite,
  type FoodLite,
} from './util/plan-snapshot.util.js';

type PhaseLike = { title: string; startWeek: number; endWeek: number; days: unknown[] };

@Injectable()
export class UserPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getLimit(limit?: number) {
    return Math.max(1, Number(limit) || Number(this.configService.get('limit.coach')) || 10);
  }

  private async resolveCoachId(userId: string): Promise<string> {
    const coach = await this.prisma.coach.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!coach) throw new NotFoundException('حساب مربی یافت نشد');
    return coach.id;
  }

  private async loadWorkoutTemplateInput(templateId: string): Promise<{
    title: string;
    input: WorkoutInput;
  }> {
    const plan = await this.prisma.workoutPlan.findUnique({
      where: { id: templateId },
      select: {
        title: true,
        workoutPhases: {
          orderBy: { order: 'asc' },
          select: {
            title: true,
            startWeek: true,
            endWeek: true,
            days: {
              select: {
                weekday: true,
                title: true,
                isRestDay: true,
                notes: true,
                exercises: {
                  orderBy: { order: 'asc' },
                  select: {
                    exerciseId: true,
                    order: true,
                    sets: true,
                    reps: true,
                    durationSec: true,
                    restSec: true,
                    notes: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('قالب ورزشی یافت نشد');
    return {
      title: plan.title,
      input: {
        phases: plan.workoutPhases.map((p) => ({
          title: p.title,
          startWeek: p.startWeek,
          endWeek: p.endWeek,
          days: p.days.map((d) => ({
            weekday: d.weekday,
            title: d.title,
            isRestDay: d.isRestDay,
            notes: d.notes,
            exercises: d.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              order: e.order,
              sets: e.sets,
              reps: e.reps,
              durationSec: e.durationSec,
              restSec: e.restSec,
              notes: e.notes,
            })),
          })),
        })),
      },
    };
  }

  private async loadDietTemplateInput(templateId: string): Promise<{
    title: string;
    input: DietInput;
  }> {
    const plan = await this.prisma.dietPlan.findUnique({
      where: { id: templateId },
      select: {
        title: true,
        targetCalories: true,
        targetProteinG: true,
        targetCarbsG: true,
        targetFatG: true,
        dietPhases: {
          orderBy: { order: 'asc' },
          select: {
            title: true,
            startWeek: true,
            endWeek: true,
            targetCalories: true,
            targetProteinG: true,
            targetCarbsG: true,
            targetFatG: true,
            days: {
              select: {
                weekday: true,
                title: true,
                notes: true,
                meals: {
                  orderBy: { order: 'asc' },
                  select: {
                    id: true,
                    type: true,
                    priority: true,
                    order: true,
                    notes: true,
                    items: {
                      select: {
                        foodId: true,
                        quantityGrams: true,
                        notes: true,
                      },
                    },
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
        targetCalories: plan.targetCalories,
        targetProteinG: plan.targetProteinG,
        targetCarbsG: plan.targetCarbsG,
        targetFatG: plan.targetFatG,
        phases: plan.dietPhases.map((p) => ({
          title: p.title,
          startWeek: p.startWeek,
          endWeek: p.endWeek,
          targetCalories: p.targetCalories,
          targetProteinG: p.targetProteinG,
          targetCarbsG: p.targetCarbsG,
          targetFatG: p.targetFatG,
          days: p.days.map((d) => ({
            weekday: d.weekday,
            title: d.title,
            notes: d.notes,
            meals: d.meals.map((m) => ({
              id: m.id,
              type: m.type,
              priority: m.priority,
              order: m.order,
              notes: m.notes,
              items: m.items.map((i) => ({
                foodId: i.foodId,
                quantityGrams: toNum(i.quantityGrams),
                notes: i.notes,
              })),
            })),
          })),
        })),
      },
    };
  }

  private async resolveExercisesMap(ids: string[]): Promise<Map<string, ExerciseLite>> {
    if (!ids.length) return new Map();
    const rows = await this.prisma.exercise.findMany({
      where: { id: { in: ids }, isActive: true },
      select: { id: true, title: true, coverImg: true },
    });
    return new Map(rows.map((r) => [r.id, { title: r.title, cover: r.coverImg }]));
  }

  private async resolveFoodsMap(ids: string[]): Promise<Map<string, FoodLite>> {
    if (!ids.length) return new Map();
    const rows = await this.prisma.food.findMany({
      where: { id: { in: ids }, isActive: true },
      select: {
        id: true,
        name: true,
        caloriesPer100g: true,
        proteinPer100g: true,
        carbsPer100g: true,
        fatPer100g: true,
      },
    });
    return new Map(
      rows.map((r) => [
        r.id,
        {
          name: r.name,
          caloriesPer100g: toNum(r.caloriesPer100g),
          proteinPer100g: toNum(r.proteinPer100g),
          carbsPer100g: toNum(r.carbsPer100g),
          fatPer100g: toNum(r.fatPer100g),
        },
      ]),
    );
  }

  private async buildWorkoutFromTemplate(templateId: string): Promise<WorkoutSnapshot> {
    const { title, input } = await this.loadWorkoutTemplateInput(templateId);
    const map = await this.resolveExercisesMap(collectExerciseIds(input));
    return buildWorkoutSnapshot(input, { templateId, title }, map);
  }

  private async buildDietFromTemplate(templateId: string): Promise<DietSnapshot> {
    const { title, input } = await this.loadDietTemplateInput(templateId);
    const map = await this.resolveFoodsMap(collectFoodIds(input));
    return buildDietSnapshot(input, { templateId, title }, map);
  }

  private pickPhase(phases: PhaseLike[] | undefined, week: number): PhaseLike | null {
    if (!phases?.length) return null;
    return phases.find((p) => week >= p.startWeek && week <= p.endWeek) ?? null;
  }

  private currentWeek(startDate: Date | null, date: Date): number {
    if (!startDate) return 1;
    const diff = Math.floor((date.getTime() - startDate.getTime()) / 86_400_000);
    return Math.max(1, Math.floor(diff / 7) + 1);
  }

  private listSelect() {
    return {
      id: true,
      title: true,
      type: true,
      status: true,
      source: true,
      startDate: true,
      endDate: true,
      activatedAt: true,
      createdAt: true,
      workoutPlanId: true,
      dietPlanId: true,
      coachId: true,
    } as const;
  }

  async getMyPlans(userId: string, query: UserPlanQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = {
      userId,
      status: query.status ?? { not: 'DRAFT' as const },
    };

    const [data, count] = await Promise.all([
      this.prisma.userPlan.findMany({
        where,
        skip,
        take: limitPage,
        orderBy: { createdAt: 'desc' },
        select: this.listSelect(),
      }),
      this.prisma.userPlan.count({ where }),
    ]);

    return {
      plans: data.map((p) => ({
        ...p,
        startDate: p.startDate ? toDateString(p.startDate) : null,
        endDate: p.endDate ? toDateString(p.endDate) : null,
      })),
      pagination: pagination(count, page, limitPage),
    };
  }

  async getMyCurrent(userId: string) {
    const today = tehranToday();
    const plan = await this.prisma.userPlan.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [{ endDate: null }, { endDate: { gte: today } }],
      },
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        source: true,
        startDate: true,
        endDate: true,
        activatedAt: true,
        coachId: true,
        snapshotExercise: true,
        snapshotDiet: true,
      },
      orderBy: { activatedAt: 'desc' },
    });

    if (!plan) return { plan: null };

    const hasWorkout = plan.type === 'WORKOUT' || plan.type === 'ALL';
    const hasDiet = plan.type === 'DIET' || plan.type === 'ALL';
    const w = plan.snapshotExercise as WorkoutSnapshot | null;
    const d = plan.snapshotDiet as DietSnapshot | null;

    return {
      plan: {
        id: plan.id,
        title: plan.title,
        type: plan.type,
        status: plan.status,
        source: plan.source,
        startDate: plan.startDate ? toDateString(plan.startDate) : null,
        endDate: plan.endDate ? toDateString(plan.endDate) : null,
        activatedAt: plan.activatedAt,
        coachId: plan.coachId,
        hasWorkout,
        hasDiet,
        workoutDurationWeeks: w?.durationWeeks ?? null,
        dietDurationWeeks: d?.durationWeeks ?? null,
      },
    };
  }

  async getMyToday(userId: string, dateStr?: string) {
    const date = dateStr ? parseDateOnly(dateStr) : tehranToday();
    const plan = await this.prisma.userPlan.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [{ endDate: null }, { endDate: { gte: date } }],
      },
      select: {
        id: true,
        type: true,
        startDate: true,
        snapshotExercise: true,
        snapshotDiet: true,
      },
      orderBy: { activatedAt: 'desc' },
    });
    if (!plan) return { date: toDateString(date), workout: null, diet: null };

    const week = this.currentWeek(plan.startDate, date);
    const wd = weekdayOf(date);
    const wSnap = plan.snapshotExercise as WorkoutSnapshot | null;
    const dSnap = plan.snapshotDiet as DietSnapshot | null;

    let workout: unknown = null;
    if (wSnap && (plan.type === 'WORKOUT' || plan.type === 'ALL')) {
      const phase = this.pickPhase(wSnap.phases, week);
      const day = phase?.days?.find((d: { weekday: number }) => d.weekday === wd) ?? null;
      workout = day
        ? { week, phaseTitle: phase!.title, ...day }
        : { week, phaseTitle: phase?.title ?? null, rest: true };
    }

    let diet: unknown = null;
    if (dSnap && (plan.type === 'DIET' || plan.type === 'ALL')) {
      const dietStart = dSnap.startDate ? parseDateOnly(dSnap.startDate) : plan.startDate;
      const dWeek = this.currentWeek(dietStart, date);
      const phase = this.pickPhase(dSnap.phases, dWeek);
      const day = phase?.days?.find((d: { weekday: number }) => d.weekday === wd) ?? null;
      diet = day
        ? { week: dWeek, phaseTitle: phase!.title, ...day }
        : { week: dWeek, phaseTitle: phase?.title ?? null, empty: true };
    }

    return { date: toDateString(date), planId: plan.id, workout, diet };
  }

  async getMyPart(userId: string, part: 'workout' | 'diet', week?: number) {
    const plan = await this.prisma.userPlan.findFirst({
      where: { userId, status: 'ACTIVE' },
      select: {
        id: true,
        type: true,
        startDate: true,
        snapshotExercise: true,
        snapshotDiet: true,
      },
      orderBy: { activatedAt: 'desc' },
    });
    if (!plan) throw new NotFoundException('برنامه‌ی فعالی ندارید');

    const isWorkout = part === 'workout';
    if (isWorkout && plan.type === 'DIET') {
      throw new BadRequestException('برنامه‌ی فعال بخش ورزشی ندارد');
    }
    if (!isWorkout && plan.type === 'WORKOUT') {
      throw new BadRequestException('برنامه‌ی فعال بخش غذایی ندارد');
    }

    const snap = (isWorkout ? plan.snapshotExercise : plan.snapshotDiet) as
      | WorkoutSnapshot
      | DietSnapshot
      | null;
    if (!snap) throw new NotFoundException('snapshot یافت نشد');

    const start =
      !isWorkout && 'startDate' in snap && snap.startDate
        ? parseDateOnly(snap.startDate)
        : plan.startDate;
    const resolvedWeek = week ?? this.currentWeek(start, tehranToday());
    const phase = this.pickPhase(snap.phases, resolvedWeek);

    const outline = snap.phases.map((p) => ({
      title: p.title,
      startWeek: p.startWeek,
      endWeek: p.endWeek,
    }));

    return {
      planId: plan.id,
      part,
      requestedWeek: resolvedWeek,
      durationWeeks: snap.durationWeeks,
      outline,
      phase: phase
        ? {
            title: phase.title,
            startWeek: phase.startWeek,
            endWeek: phase.endWeek,
            days: phase.days,
          }
        : null,
    };
  }

  async getCoachPlans(coachUserId: string, query: UserPlanQueryDto) {
    const coachId = await this.resolveCoachId(coachUserId);
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = {
      coachId,
      ...(query.status ? { status: query.status } : { status: { not: 'CANCELLED' as const } }),
    };

    const [data, count] = await Promise.all([
      this.prisma.userPlan.findMany({
        where,
        skip,
        take: limitPage,
        orderBy: { createdAt: 'desc' },
        select: {
          ...this.listSelect(),
          requestId: true,
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.userPlan.count({ where }),
    ]);

    return {
      plans: data.map((p) => ({
        ...p,
        startDate: p.startDate ? toDateString(p.startDate) : null,
        endDate: p.endDate ? toDateString(p.endDate) : null,
      })),
      pagination: pagination(count, page, limitPage),
    };
  }

  async createDraft(coachUserId: string, requestId: string) {
    const coachId = await this.resolveCoachId(coachUserId);

    const existing = await this.prisma.userPlan.findFirst({
      where: { requestId, coachId, status: { in: ['DRAFT', 'ACTIVE'] } },
      select: { id: true, status: true, type: true },
    });
    if (existing) {
      return { id: existing.id, status: existing.status, type: existing.type, created: false };
    }

    const req = await this.prisma.planRequest.findFirst({
      where: { id: requestId, coachId, status: 'PAID' },
      select: {
        id: true,
        userId: true,
        workoutTemplateId: true,
        dietTemplateId: true,
      },
    });
    if (!req) {
      throw new NotFoundException(
        'درخواست پرداخت‌شده یافت نشد (فقط وضعیت PAID قابل ساخت پیش‌نویس است)',
      );
    }
    if (!req.workoutTemplateId && !req.dietTemplateId) {
      throw new BadRequestException('درخواست فاقد قالب برنامه است');
    }

    let snapshotExercise: WorkoutSnapshot | null = null;
    let snapshotDiet: DietSnapshot | null = null;
    const titleParts: string[] = [];

    if (req.workoutTemplateId) {
      snapshotExercise = await this.buildWorkoutFromTemplate(req.workoutTemplateId);
      titleParts.push(snapshotExercise.title);
    }
    if (req.dietTemplateId) {
      snapshotDiet = await this.buildDietFromTemplate(req.dietTemplateId);
      titleParts.push(snapshotDiet.title);
    }

    const type =
      snapshotExercise && snapshotDiet ? 'ALL' : snapshotExercise ? 'WORKOUT' : 'DIET';

    try {
      const plan = await this.prisma.userPlan.create({
        data: {
          userId: req.userId,
          coachId,
          requestId: req.id,
          workoutPlanId: req.workoutTemplateId,
          dietPlanId: req.dietTemplateId,
          title: titleParts.join(' + ') || 'برنامه اختصاصی',
          status: 'DRAFT',
          source: 'COACH',
          type,
          snapshotExercise: toJson(snapshotExercise),
          snapshotDiet: toJson(snapshotDiet),
          customizedAt: new Date(),
        },
        select: { id: true, status: true, type: true },
      });
      return { id: plan.id, status: plan.status, type: plan.type, created: true };
    } catch (e: any) {
      const again = await this.prisma.userPlan.findFirst({
        where: { requestId, coachId },
        select: { id: true, status: true, type: true },
      });
      if (again) {
        return { id: again.id, status: again.status, type: again.type, created: false };
      }
      throw e;
    }
  }

  async getCoachPlan(coachUserId: string, id: string) {
    const coachId = await this.resolveCoachId(coachUserId);
    const plan = await this.prisma.userPlan.findFirst({
      where: { id, coachId },
      select: {
        id: true,
        title: true,
        status: true,
        type: true,
        startDate: true,
        endDate: true,
        snapshotExercise: true,
        snapshotDiet: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد');
    return {
      ...plan,
      startDate: plan.startDate ? toDateString(plan.startDate) : null,
      endDate: plan.endDate ? toDateString(plan.endDate) : null,
    };
  }

  async updateSnapshot(
    coachUserId: string,
    id: string,
    dto: UpdateUserPlanSnapshotDto,
  ) {
    if (!dto.workout && !dto.diet) {
      throw new BadRequestException('حداقل یکی از workout یا diet را بفرستید');
    }
    const coachId = await this.resolveCoachId(coachUserId);
    const plan = await this.prisma.userPlan.findFirst({
      where: { id, coachId },
      select: {
        id: true,
        status: true,
        type: true,
        snapshotExercise: true,
        snapshotDiet: true,
      },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد');
    if (plan.status !== 'DRAFT') {
      throw new ConflictException('فقط پیش‌نویس قابل ویرایش است');
    }

    const data: {
      snapshotExercise?: unknown;
      snapshotDiet?: unknown;
      customizedAt: Date;
    } = { customizedAt: new Date() };

    if (dto.workout) {
      if (plan.type === 'DIET') {
        throw new BadRequestException('این برنامه بخش ورزشی ندارد');
      }
      const prev = plan.snapshotExercise as WorkoutSnapshot | null;
      const map = await this.resolveExercisesMap(collectExerciseIds(dto.workout));
      data.snapshotExercise = toJson(
        buildWorkoutSnapshot(
          dto.workout,
          {
            templateId: prev?.templateId ?? null,
            title: prev?.title ?? 'برنامه ورزشی',
          },
          map,
        ),
      );
    }

    if (dto.diet) {
      if (plan.type === 'WORKOUT') {
        throw new BadRequestException('این برنامه بخش غذایی ندارد');
      }
      const prev = plan.snapshotDiet as DietSnapshot | null;
      const map = await this.resolveFoodsMap(collectFoodIds(dto.diet));
      data.snapshotDiet = toJson(
        buildDietSnapshot(
          dto.diet,
          {
            templateId: prev?.templateId ?? null,
            title: prev?.title ?? 'برنامه غذایی',
          },
          map,
        ),
      );
    }

    await this.prisma.userPlan.update({ where: { id }, data: data as any });
    return { id, updated: true };
  }

  async activate(coachUserId: string, id: string, dto: ActivateUserPlanDto) {
    const coachId = await this.resolveCoachId(coachUserId);
    const today = tehranToday();
    const start = dto.startDate ? parseDateOnly(dto.startDate) : today;
    if (start < today) throw new BadRequestException('تاریخ شروع نمی‌تواند گذشته باشد');
    if (start > addDays(today, 60)) {
      throw new BadRequestException('تاریخ شروع حداکثر ۶۰ روز بعد مجاز است');
    }

    const plan = await this.prisma.userPlan.findFirst({
      where: { id, coachId },
      select: {
        id: true,
        userId: true,
        status: true,
        type: true,
        requestId: true,
        snapshotExercise: true,
        snapshotDiet: true,
      },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد');
    if (plan.status !== 'DRAFT') {
      throw new ConflictException('فقط پیش‌نویس قابل فعال‌سازی است');
    }

    const wSnap = plan.snapshotExercise as WorkoutSnapshot | null;
    const dSnap = plan.snapshotDiet as DietSnapshot | null;
    const durationWeeks = Math.max(
      wSnap?.durationWeeks ?? 0,
      dSnap?.durationWeeks ?? 0,
      1,
    );
    const endDate = addDays(start, durationWeeks * 7 - 1);

    if (plan.type === 'DIET') {
      if (!dSnap) throw new BadRequestException('snapshot غذایی خالی است');

      return this.prisma.$transaction(async (tx) => {
        const active = await tx.userPlan.findFirst({
          where: {
            userId: plan.userId,
            status: 'ACTIVE',
            OR: [{ endDate: null }, { endDate: { gte: today } }],
          },
          select: {
            id: true,
            type: true,
            snapshotDiet: true,
            startDate: true,
            endDate: true,
          },
          orderBy: { activatedAt: 'desc' },
        });
        if (!active) {
          throw new ConflictException(
            'کاربر برنامه‌ی ورزشی فعال ندارد؛ ابتدا برنامه‌ی ورزشی را تحویل دهید',
          );
        }
        if (active.type === 'DIET') {
          throw new ConflictException('کاربر هم‌اکنون برنامه‌ی غذایی فعال دارد');
        }

        const dietWithStart: DietSnapshot = {
          ...dSnap,
          startDate: toDateString(start),
        };

        const updated = await tx.userPlan.update({
          where: { id: active.id },
          data: {
            type: 'ALL',
            snapshotDiet: toJson(dietWithStart),
            customizedAt: new Date(),
            endDate:
              !active.endDate || endDate > active.endDate ? endDate : active.endDate,
          },
          select: { id: true, type: true, startDate: true, endDate: true },
        });

        await tx.userPlan.update({
          where: { id: plan.id },
          data: { status: 'COMPLETED' },
        });
        if (plan.requestId) {
          await tx.planRequest.updateMany({
            where: { id: plan.requestId, status: 'PAID' },
            data: { status: 'DELIVERED' },
          });
        }

        return {
          id: updated.id,
          status: 'ACTIVE' as const,
          type: updated.type,
          startDate: toDateString(updated.startDate ?? start),
          endDate: toDateString(updated.endDate ?? endDate),
        };
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const conflict = await tx.userPlan.count({
        where: {
          userId: plan.userId,
          status: 'ACTIVE',
          id: { not: plan.id },
          OR: [{ endDate: null }, { endDate: { gte: today } }],
        },
      });
      if (conflict > 0) {
        throw new ConflictException(
          'کاربر هم‌اکنون برنامه‌ی فعال دارد؛ ابتدا آن را تکمیل/لغو کنید',
        );
      }

      await tx.userPlan.updateMany({
        where: { userId: plan.userId, status: 'ACTIVE' },
        data: { status: 'COMPLETED' },
      });

      const { count } = await tx.userPlan.updateMany({
        where: { id: plan.id, status: 'DRAFT' },
        data: {
          status: 'ACTIVE',
          startDate: start,
          endDate,
          activatedAt: new Date(),
        },
      });
      if (!count) throw new ConflictException('وضعیت برنامه هم‌زمان تغییر کرد');

      if (plan.requestId) {
        await tx.planRequest.updateMany({
          where: { id: plan.requestId, status: 'PAID' },
          data: { status: 'DELIVERED' },
        });
      }

      return {
        id: plan.id,
        status: 'ACTIVE' as const,
        type: plan.type,
        startDate: toDateString(start),
        endDate: toDateString(endDate),
      };
    });
  }
}
