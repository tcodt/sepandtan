import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import {
  CreateDietPlanDto, UpdateDietPlanDto,
  CreateDietPhaseDto, UpdateDietPhaseDto,
  CreateDietDayDto, UpdateDietDayDto, CopyDietDayDto,
  CreateDietMealDto, UpdateDietMealDto,
  CreateDietMealItemDto, UpdateDietMealItemDto,
  SortOptionDietPlan,
  SearchPlanDietUser,
  SearchPlanDietAdmin,
  SearchPlanDietCoach,
} from './dto/diet.dto.js';
import { Prisma } from '../../generated/prisma/client.js';

// ───────── ثابت‌ها و تایپ‌ها ─────────

/** پیش‌نمایش عمومی: اولین فاز، این تعداد روز/وعده/آیتم */
const PREVIEW_DAYS = 3;
const PREVIEW_MEALS = 3;
const PREVIEW_ITEMS = 3;

/** فقط همین فیلدها از بیرون قابل ویرایش‌اند (جلوگیری از mass-assignment) */
const PLAN_UPDATABLE = [
  'title', 'description', 'coverImage', 'price', 'discountPrice', 'trainingGoalId',
  'targetCalories', 'targetProteinG', 'targetCarbsG', 'targetFatG', 'durationWeeks',
] as const;
const PHASE_UPDATABLE = [
  'title', 'startWeek', 'endWeek', 'order',
  'targetCalories', 'targetProteinG', 'targetCarbsG', 'targetFatG',
] as const;
const DAY_UPDATABLE = ['weekday', 'title', 'notes'] as const;
const MEAL_UPDATABLE = ['type', 'priority', 'order', 'notes'] as const;
const ITEM_UPDATABLE = ['foodId', 'quantityGrams', 'notes'] as const;

type Num = number | { toNumber(): number };
const toNum = (v: Num): number => (typeof v === 'number' ? v : v.toNumber());
const round1 = (n: number) => Math.round(n * 10) / 10;

interface Macros { calories: number; proteinG: number; carbsG: number; fatG: number }

interface ItemRow {
  quantityGrams: Num;
  food: { caloriesPer100g: Num; proteinPer100g: Num; carbsPer100g: Num; fatPer100g: Num };
}
interface MealRow { priority: string; items: ItemRow[] }
interface DayRow { meals: MealRow[] }
interface PhaseRow { days: DayRow[] }

@Injectable()
export class DietService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  private buildPlanOrderBy(
    sortBy: SortOptionDietPlan,
  ): Prisma.DietPlanOrderByWithRelationInput {
    switch (sortBy) {
      case SortOptionDietPlan.OLDEST:
        return { createdAt: 'asc' }
      case SortOptionDietPlan.NEWEST:
        return { createdAt: 'desc' }
      case SortOptionDietPlan.MORE_PRICE:
        return {
          price: 'desc'
        }
      case SortOptionDietPlan.LOW_PRICE:
        return {
          price: 'asc'
        }
      case SortOptionDietPlan.MORE_RATE:
        return {
          avgRating: 'desc'
        }
      case SortOptionDietPlan.LOW_RATE:
        return {
          avgRating: 'asc'
        }
      default:
        return { createdAt: 'desc' }
    }
  }

  // ───────── Helpers ─────────

  private getLimit(limit?: number) {
    return Math.max(1, Number(limit) || Number(this.configService.get('limit.coach')) || 10);
  }

  private hasCode(e: unknown, code: string): boolean {
    return typeof e === 'object' && e !== null && (e as { code?: string }).code === code;
  }

  private pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Partial<Pick<T, K>> {
    const out: Partial<Pick<T, K>> = {};
    for (const key of keys) {
      if (obj[key] !== undefined) out[key] = obj[key];
    }
    return out;
  }

  private async resolveCoachId(userId: string) {
    const coach = await this.prisma.coach.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!coach) throw new NotFoundException('حساب مربی یافت نشد');
    return coach.id;
  }

  /**
   * فاز می‌تواند تا durationWeeks + 1 برود (برنامه‌ای که وسط هفته شروع می‌شود
   * ممکن است یک هفته‌ی تقویمی بیشتر را پوشش دهد).
   */
  private assertPhaseWindow(
    durationWeeks: number | null | undefined,
    startWeek: number,
    endWeek: number,
  ) {
    if (startWeek < 1 || endWeek < startWeek) {
      throw new BadRequestException('بازه هفته نامعتبر است');
    }
    if (durationWeeks != null && endWeek > durationWeeks + 1) {
      throw new BadRequestException(
        `پایان فاز از مدت برنامه+۱ (${durationWeeks + 1}) بیشتر است`,
      );
    }
  }

  private assertPricing(price: number, discountPrice: number | null | undefined) {
    if (discountPrice != null && discountPrice > price) {
      throw new BadRequestException('قیمت تخفیفی نمی‌تواند از قیمت اصلی بیشتر باشد');
    }
  }

  // ───────── Select ها ─────────

  private planSummarySelect() {
    return {
      id: true,
      title: true,
      description: true,
      coverImage: true,
      price: true,
      discountPrice: true,
      discountExpired: true,
      durationWeeks: true,
      targetCalories: true,
      targetProteinG: true,
      targetCarbsG: true,
      targetFatG: true,
      avgRating: true,
      countRating: true,
      isPublished: true,
      source: true,
      trainingGoalId: true,
      createdAt: true,
      updatedAt: true,
      coach: { select: { id: true, title: true, slug: true } },
      trainingGoal: { select: { id: true, title: true, logo: true } },
    } as const;
  }

  private foodSelect(forCoach: boolean) {
    return {
      id: true,
      name: true,
      caloriesPer100g: true,
      proteinPer100g: true,
      carbsPer100g: true,
      fatPer100g: true,
      ...(forCoach ? { isActive: true } : {}),
    } as const;
  }

  /** preview=true → اولین فاز + سقف روز/وعده/آیتم (برای نمای عمومی) */
  private phasesSelect(preview: boolean) {
    const take = (n: number) => (preview ? { take: n } : {});
    return {
      orderBy: { startWeek: 'asc' },
      ...take(1),
      select: {
        id: true,
        title: true,
        startWeek: true,
        endWeek: true,
        order: true,
        targetCalories: true,
        targetProteinG: true,
        targetCarbsG: true,
        targetFatG: true,
        days: {
          orderBy: { weekday: 'asc' },
          ...take(PREVIEW_DAYS),
          select: {
            id: true,
            weekday: true,
            title: true,
            notes: true,
            meals: {
              orderBy: { order: 'asc' },
              ...take(PREVIEW_MEALS),
              select: {
                id: true,
                type: true,
                priority: true,
                order: true,
                notes: true,
                items: {
                  ...take(PREVIEW_ITEMS),
                  select: {
                    id: true,
                    quantityGrams: true,
                    notes: true,
                    food: { select: this.foodSelect(!preview) },
                  },
                },
              },
            },
          },
        },
      },
    } as const;
  }

  /** عمومی: منتشرشده + (برنامه‌ی سایت/AI یا مربی‌ی تاییدشده) */
  private publicWhere() {
    return {
      isPublished: true,
      OR: [{ coachId: null }, { coach: { status: 'APPROVED' as const } }],
    };
  }

  // ───────── Serialize (Decimal → number، محاسبه‌ی تغذیه) ─────────

  private serializePlan<
    T extends { price: Num; discountPrice: Num | null; avgRating: Num; discountExpired: Date | null },
  >(plan: T, hideExpiredDiscount = false) {
    const expired =
      hideExpiredDiscount && plan.discountExpired != null && plan.discountExpired.getTime() < Date.now();
    return {
      ...plan,
      price: toNum(plan.price),
      discountPrice: plan.discountPrice == null || expired ? null : toNum(plan.discountPrice),
      avgRating: toNum(plan.avgRating),
    };
  }

  private sumMacros(list: Macros[]): Macros {
    const total = list.reduce(
      (acc, m) => ({
        calories: acc.calories + m.calories,
        proteinG: acc.proteinG + m.proteinG,
        carbsG: acc.carbsG + m.carbsG,
        fatG: acc.fatG + m.fatG,
      }),
      { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
    );
    return {
      calories: round1(total.calories),
      proteinG: round1(total.proteinG),
      carbsG: round1(total.carbsG),
      fatG: round1(total.fatG),
    };
  }

  private mapItem<I extends ItemRow>(item: I) {
    const qty = toNum(item.quantityGrams);
    const f = item.food;
    const cal = toNum(f.caloriesPer100g);
    const pro = toNum(f.proteinPer100g);
    const carb = toNum(f.carbsPer100g);
    const fat = toNum(f.fatPer100g);
    const k = qty / 100;
    const nutrition: Macros = {
      calories: round1(cal * k),
      proteinG: round1(pro * k),
      carbsG: round1(carb * k),
      fatG: round1(fat * k),
    };
    return {
      ...item,
      quantityGrams: qty,
      food: { ...f, caloriesPer100g: cal, proteinPer100g: pro, carbsPer100g: carb, fatPer100g: fat },
      nutrition,
    };
  }

  private mapMeal<M extends MealRow>(meal: M) {
    const items = meal.items.map((i) => this.mapItem(i));
    return { ...meal, items, nutrition: this.sumMacros(items.map((i) => i.nutrition)) };
  }

  /** جمع روز = فقط وعده‌های PRIMARY (SECONDARY/TERTIARY جایگزین‌اند) */
  private mapDay<D extends DayRow>(day: D) {
    const meals = day.meals.map((m) => this.mapMeal(m));
    const nutrition = this.sumMacros(
      meals.filter((m) => m.priority === 'PRIMARY').map((m) => m.nutrition),
    );
    return { ...day, meals, nutrition };
  }

  private mapPhases<P extends PhaseRow>(phases: P[]) {
    return phases.map((ph) => ({ ...ph, days: ph.days.map((d) => this.mapDay(d)) }));
  }

  // ───────── Public ─────────

  async getPlans(query: SearchPlanDietUser) {
    const { limit, page = 1, sortBy, title, coachId } = query
    const limitPage = this.getLimit(limit);
    const skip = (page - 1) * limitPage;
    // const where = this.publicWhere();
    const where = {
      isPublished: true,
      ...(coachId && coachId !== undefined && { coachId }),
      ...(title && title !== undefined && { title: { contains: title, mode: 'insensitive' as const } }),
    };
    const orderBy = this.buildPlanOrderBy(sortBy ?? SortOptionDietPlan.MORE_RATE)
    const [data, count] = await Promise.all([
      this.prisma.dietPlan.findMany({
        where: {
        }, skip, take: limitPage,
        orderBy: [orderBy, { createdAt: 'desc' }],
        select: this.planSummarySelect(),
      }),
      this.prisma.dietPlan.count({ where }),
    ]);
    return {
      dietPlans: data.map((p) => this.serializePlan(p, true)),
      pagination: pagination(count, page, limitPage),
    };
  }

  /** نمای عمومی محدود: برنامه‌ی کامل فقط برای مربی (و بعد از خرید) در دسترس است */
  async getPlan(id: string) {
    const plan = await this.prisma.dietPlan.findFirst({
      where: { id, ...this.publicWhere() },
      select: {
        ...this.planSummarySelect(),
        _count: { select: { dietPhases: true, days: true } },
        dietPhases: this.phasesSelect(true),
      },
    });
    if (!plan) throw new NotFoundException('برنامه غذایی یافت نشد');

    const { _count, dietPhases, ...rest } = plan;
    return {
      ...this.serializePlan(rest, true),
      isPreview: true,
      phaseCount: _count.dietPhases,
      dayCount: _count.days,
      dietPhases: this.mapPhases(dietPhases) as any,
    };
  }

  // ───────── Admin ─────────

  async getAdminPlans(query: SearchPlanDietAdmin) {
    const { limit, page = 1, sortBy, title, coachId, isPublished, source } = query
    const limitPage = this.getLimit(limit);
    const skip = (page - 1) * limitPage;
    const where = {
      ...(coachId && coachId !== undefined && { coachId }),
      ...(isPublished !== undefined && { isPublished }),
      ...(source && source !== undefined && { source }),
      ...(title && title !== undefined && { title: { contains: title, mode: 'insensitive' as const } })
    }
    const orderBy = this.buildPlanOrderBy(sortBy ?? SortOptionDietPlan.NEWEST)
    const [data, count] = await Promise.all([
      this.prisma.dietPlan.findMany({
        where,
        skip, take: limitPage,
        orderBy: orderBy,
        select: this.planSummarySelect(),
      }),
      this.prisma.dietPlan.count({ where }),
    ]);
    return {
      dietPlans: data.map((p) => this.serializePlan(p)),
      pagination: pagination(count, page, limitPage),
    };
  }

  /** نمای کامل مربی: همه‌ی فازها/روزها/وعده‌ها + جمع کالری و ماکرو */
  async getAdminPlan(id: string) {
    const plan = await this.prisma.dietPlan.findFirst({
      where: { id },
      select: {
        ...this.planSummarySelect(),
        dietPhases: {
          orderBy: { startWeek: 'asc' },
          select: {
            id: true,
            title: true,
            startWeek: true,
            endWeek: true,
            order: true,
            targetCalories: true,
            targetProteinG: true,
            targetCarbsG: true,
            targetFatG: true,
          },
        },
      },
    });

    if (!plan) throw new NotFoundException('برنامه یافت نشد یا متعلق به شما نیست');
    return {
      ...this.serializePlan(plan),
    }
  }
  // ───────── Coach: Plan ─────────
  async getMyPlans(userId: string, query: SearchPlanDietCoach) {
    const { limit, page = 1, sortBy, title, isPublished } = query
    const limitPage = this.getLimit(limit);
    const skip = (page - 1) * limitPage;
    const where = {
      coach: { userId },
      ...(isPublished !== undefined && { isPublished }),
      ...(title && title !== undefined && { title: { contains: title, mode: 'insensitive' as const } })
    }
    const orderBy = this.buildPlanOrderBy(sortBy ?? SortOptionDietPlan.NEWEST)
    const [data, count] = await Promise.all([
      this.prisma.dietPlan.findMany({
        where, skip, take: limitPage,
        orderBy: orderBy,
        select: this.planSummarySelect(),
      }),
      this.prisma.dietPlan.count({ where }),
    ]);
    return {
      dietPlans: data.map((p) => this.serializePlan(p)),
      pagination: pagination(count, page, limitPage),
    };
  }

  async getMyPlansSelector(userId: string) {
    const where = { coach: { userId } };
    return this.prisma.dietPlan.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        trainingGoal: { select: { id: true, title: true } }
      },
    })
  }

  /** نمای کامل مربی: همه‌ی فازها/روزها/وعده‌ها + جمع کالری و ماکرو */
  async getMyPlan(userId: string, id: string) {
    const plan = await this.prisma.dietPlan.findFirst({
      where: { id, coach: { userId } },
      select: {
        ...this.planSummarySelect(),
        dietPhases: {
          orderBy: { startWeek: 'asc' },
          select: {
            id: true,
            title: true,
            startWeek: true,
            endWeek: true,
            order: true,
            targetCalories: true,
            targetProteinG: true,
            targetCarbsG: true,
            targetFatG: true,
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد یا متعلق به شما نیست');
    return {
      ...this.serializePlan(plan),
    }
  }

  async createPlan(userId: string, dto: CreateDietPlanDto) {
    const coachId = await this.resolveCoachId(userId);
    this.assertPricing(dto.price, dto.discountPrice);

    try {
      const plan = await this.prisma.dietPlan.create({
        data: {
          coachId,
          source: 'COACH',
          isPublished: false,
          title: dto.title,
          description: dto.description,
          coverImage: dto.coverImage,
          price: dto.price,
          discountPrice: dto.discountPrice,
          discountExpired: dto.discountExpired ? new Date(dto.discountExpired) : undefined,
          trainingGoalId: dto.trainingGoalId,
          targetCalories: dto.targetCalories,
          targetProteinG: dto.targetProteinG,
          targetCarbsG: dto.targetCarbsG,
          targetFatG: dto.targetFatG,
          durationWeeks: dto.durationWeeks,
        },
        select: this.planSummarySelect(),
      });
      return this.serializePlan(plan);
    } catch (e) {
      if (this.hasCode(e, 'P2003')) throw new BadRequestException('هدف تمرینی نامعتبر است');
      throw e;
    }
  }

  async updatePlan(userId: string, id: string, dto: UpdateDietPlanDto) {
    const plan = await this.checkPlanOwner(userId, id);

    if (dto.price !== undefined || dto.discountPrice !== undefined) {
      const price = dto.price ?? plan.price.toNumber();
      const discount =
        dto.discountPrice !== undefined
          ? dto.discountPrice
          : (plan.discountPrice?.toNumber() ?? null);
      this.assertPricing(price, discount);
    }

    if (dto.durationWeeks != null) {
      const maxEnd = await this.prisma.dietPhase.aggregate({
        where: { planId: id },
        _max: { endWeek: true },
      });
      const end = maxEnd._max.endWeek;
      if (end != null && end > dto.durationWeeks + 1) {
        throw new BadRequestException(
          `فازها تا هفته ${end} هستند؛ durationWeeks را تنظیم کن`,
        );
      }
    }

    try {
      const updated = await this.prisma.dietPlan.update({
        where: { id },
        data: {
          ...this.pick(dto, PLAN_UPDATABLE),
          ...(dto.discountExpired !== undefined && {
            discountExpired: dto.discountExpired ? new Date(dto.discountExpired) : null,
          }),
        },
        select: this.planSummarySelect(),
      });
      return this.serializePlan(updated);
    } catch (e) {
      if (this.hasCode(e, 'P2003')) throw new BadRequestException('هدف تمرینی نامعتبر است');
      throw e;
    }
  }

  async deletePlan(userId: string, id: string) {
    try {
      const { count } = await this.prisma.dietPlan.deleteMany({
        where: { id, coach: { userId } },
      });
      if (!count) throw new NotFoundException('برنامه یافت نشد یا متعلق به شما نیست');
      return { success: true };
    } catch (e) {
      // UserPlan.dietPlan → onDelete: Restrict
      if (this.hasCode(e, 'P2003')) {
        throw new ConflictException(
          'این برنامه توسط کاربران استفاده شده و قابل حذف نیست؛ به‌جای حذف، انتشار آن را لغو کن',
        );
      }
      throw e;
    }
  }

  async togglePublish(userId: string, id: string) {
    const plan = await this.prisma.dietPlan.findFirst({
      where: { id, coach: { userId } },
      select: { id: true, isPublished: true, coach: { select: { status: true } } },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد یا متعلق به شما نیست');

    // لغو انتشار همیشه مجاز است
    if (!plan.isPublished) {
      if (plan.coach?.status !== 'APPROVED') {
        throw new BadRequestException('حساب مربی هنوز توسط ادمین تایید نشده است');
      }

      const [hasPhase, hasItem, emptyDay, emptyMeal] = await Promise.all([
        this.prisma.dietPhase.findFirst({ where: { planId: id }, select: { id: true } }),
        this.prisma.dietMealItem.findFirst({
          where: { meal: { day: { planId: id } } },
          select: { id: true },
        }),
        this.prisma.dietDay.findFirst({
          where: { planId: id, meals: { none: {} } },
          select: { id: true },
        }),
        this.prisma.dietMeal.findFirst({
          where: { day: { planId: id }, items: { none: {} } },
          select: { id: true },
        }),
      ]);

      const problems: string[] = [];
      if (!hasPhase) problems.push('حداقل یک فاز لازم است');
      if (!hasItem) problems.push('حداقل یک آیتم غذایی لازم است');
      if (emptyDay) problems.push('روزی بدون وعده وجود دارد');
      if (emptyMeal) problems.push('وعده‌ای بدون آیتم غذایی وجود دارد');
      if (problems.length) {
        throw new BadRequestException({
          statusCode: 400,
          error: 'Bad Request',
          message: problems,
        });
      }
    }

    return this.prisma.dietPlan.update({
      where: { id },
      data: { isPublished: !plan.isPublished },
      select: { id: true, isPublished: true },
    });
  }

  private async checkPlanOwner(userId: string, planId: string) {
    const plan = await this.prisma.dietPlan.findFirst({
      where: { id: planId, coach: { userId } },
      select: { id: true, durationWeeks: true, price: true, discountPrice: true },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد یا متعلق به شما نیست');
    return plan;
  }

  // ───────── Coach: Phase ─────────
  async getOnePhase(id: string) {
    const plan = await this.prisma.dietPhase.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        startWeek: true,
        endWeek: true,
        order: true,
        targetCalories: true,
        targetProteinG: true,
        targetCarbsG: true,
        targetFatG: true,
        days: {
          orderBy: { weekday: 'asc' },
          select: {
            id: true,
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
                    id: true,
                    quantityGrams: true,
                    notes: true,
                    food: { select: this.foodSelect(true) },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد یا متعلق به شما نیست');
    return {
      dietPhases: this.mapPhases([plan]) as any,
    }
  }

  async addPhase(userId: string, planId: string, dto: CreateDietPhaseDto) {
    // مالکیت و تداخل موازی چک می‌شوند (۲ رفت‌وبرگشت به‌جای ۳)
    const [plan, overlap] = await Promise.all([
      this.checkPlanOwner(userId, planId),
      this.prisma.dietPhase.findFirst({
        where: {
          planId,
          startWeek: { lte: dto.endWeek },
          endWeek: { gte: dto.startWeek },
        },
        select: { title: true },
      }),
    ]);

    this.assertPhaseWindow(plan.durationWeeks, dto.startWeek, dto.endWeek);
    if (overlap) throw new BadRequestException(`تداخل با فاز «${overlap.title}»`);

    try {
      return await this.prisma.dietPhase.create({
        data: {
          planId,
          title: dto.title,
          startWeek: dto.startWeek,
          endWeek: dto.endWeek,
          order: dto.order ?? dto.startWeek,
          targetCalories: dto.targetCalories,
          targetProteinG: dto.targetProteinG,
          targetCarbsG: dto.targetCarbsG,
          targetFatG: dto.targetFatG,
        },
      });
    } catch (e) {
      if (this.hasCode(e, 'P2002')) throw new ConflictException('startWeek تکراری است');
      throw e;
    }
  }

  async updatePhase(userId: string, phaseId: string, dto: UpdateDietPhaseDto) {
    const phase = await this.checkPhaseOwner(userId, phaseId);
    const start = dto.startWeek ?? phase.startWeek;
    const end = dto.endWeek ?? phase.endWeek;
    this.assertPhaseWindow(phase.plan.durationWeeks, start, end);

    if (dto.startWeek != null || dto.endWeek != null) {
      const overlap = await this.prisma.dietPhase.findFirst({
        where: {
          planId: phase.planId,
          id: { not: phaseId },
          startWeek: { lte: end },
          endWeek: { gte: start },
        },
        select: { title: true },
      });
      if (overlap) throw new BadRequestException(`تداخل با فاز «${overlap.title}»`);
    }

    try {
      return await this.prisma.dietPhase.update({
        where: { id: phaseId },
        data: this.pick(dto, PHASE_UPDATABLE),
      });
    } catch (e) {
      if (this.hasCode(e, 'P2002')) throw new ConflictException('startWeek تکراری است');
      throw e;
    }
  }

  async deletePhase(userId: string, phaseId: string) {
    const { count } = await this.prisma.dietPhase.deleteMany({
      where: { id: phaseId, plan: { coach: { userId } } },
    });
    if (!count) throw new NotFoundException('فاز یافت نشد یا متعلق به شما نیست');
    return { success: true };
  }

  private async checkPhaseOwner(userId: string, phaseId: string) {
    const phase = await this.prisma.dietPhase.findFirst({
      where: { id: phaseId, plan: { coach: { userId } } },
      select: {
        id: true,
        planId: true,
        startWeek: true,
        endWeek: true,
        plan: { select: { durationWeeks: true } },
      },
    });
    if (!phase) throw new NotFoundException('فاز یافت نشد یا متعلق به شما نیست');
    return phase;
  }

  // ───────── Coach: Day ─────────

  async addDay(userId: string, planId: string, dto: CreateDietDayDto) {
    // یک کوئری: هم مالکیت برنامه، هم تعلق فاز به همین برنامه
    const phase = await this.prisma.dietPhase.findFirst({
      where: { id: dto.dietPhaseId, planId, plan: { coach: { userId } } },
      select: { id: true },
    });
    if (!phase) throw new NotFoundException('فاز یافت نشد یا به این برنامه تعلق ندارد');

    try {
      return await this.prisma.dietDay.create({
        data: {
          planId,
          dietPhaseId: dto.dietPhaseId,
          weekday: dto.weekday,
          title: dto.title,
          notes: dto.notes,
        },
      });
    } catch (e) {
      if (this.hasCode(e, 'P2002')) throw new ConflictException('این weekday در فاز تکراری است');
      throw e;
    }
  }

  async updateDay(userId: string, dayId: string, dto: UpdateDietDayDto) {
    try {
      return await this.prisma.dietDay.update({
        where: { id: dayId, plan: { coach: { userId } } },
        data: this.pick(dto, DAY_UPDATABLE),
      });
    } catch (e) {
      if (this.hasCode(e, 'P2025')) throw new NotFoundException('روز یافت نشد یا متعلق به شما نیست');
      if (this.hasCode(e, 'P2002')) throw new ConflictException('این weekday در فاز تکراری است');
      throw e;
    }
  }

  async deleteDay(userId: string, dayId: string) {
    const { count } = await this.prisma.dietDay.deleteMany({
      where: { id: dayId, plan: { coach: { userId } } },
    });
    if (!count) throw new NotFoundException('روز یافت نشد یا متعلق به شما نیست');
    return { success: true };
  }

  /** کپی روز (با همه‌ی وعده‌ها و آیتم‌ها) به weekday/فاز دیگر — در یک تراکنش */
  async copyDay(userId: string, dayId: string, dto: CopyDietDayDto) {
    const src = await this.prisma.dietDay.findFirst({
      where: { id: dayId, plan: { coach: { userId } } },
      select: {
        planId: true,
        dietPhaseId: true,
        title: true,
        notes: true,
        meals: {
          orderBy: { order: 'asc' },
          select: {
            type: true,
            priority: true,
            order: true,
            notes: true,
            items: { select: { foodId: true, quantityGrams: true, notes: true } },
          },
        },
      },
    });
    if (!src) throw new NotFoundException('روز یافت نشد یا متعلق به شما نیست');

    const targetPhaseId = dto.dietPhaseId ?? src.dietPhaseId;
    if (targetPhaseId !== src.dietPhaseId) {
      const phase = await this.prisma.dietPhase.findFirst({
        where: { id: targetPhaseId, planId: src.planId },
        select: { id: true },
      });
      if (!phase) throw new BadRequestException('فاز مقصد به این برنامه تعلق ندارد');
    }

    try {
      const created = await this.prisma.dietDay.create({
        data: {
          planId: src.planId,
          dietPhaseId: targetPhaseId,
          weekday: dto.weekday,
          title: src.title,
          notes: src.notes,
          meals: {
            create: src.meals.map((m) => ({
              type: m.type,
              priority: m.priority,
              order: m.order,
              notes: m.notes,
              items: {
                create: m.items.map((i) => ({
                  foodId: i.foodId,
                  quantityGrams: i.quantityGrams,
                  notes: i.notes,
                })),
              },
            })),
          },
        },
        select: {
          id: true,
          planId: true,
          dietPhaseId: true,
          weekday: true,
          title: true,
          notes: true,
          _count: { select: { meals: true } },
        },
      });
      const { _count, ...day } = created;
      return { ...day, mealCount: _count.meals };
    } catch (e) {
      if (this.hasCode(e, 'P2002')) throw new ConflictException('این weekday در فاز مقصد تکراری است');
      throw e;
    }
  }

  // ───────── Coach: Meal ─────────

  async addMeal(userId: string, dayId: string, dto: CreateDietMealDto) {
    const day = await this.prisma.dietDay.findFirst({
      where: { id: dayId, plan: { coach: { userId } } },
      select: { id: true },
    });
    if (!day) throw new NotFoundException('روز یافت نشد یا متعلق به شما نیست');

    return this.prisma.dietMeal.create({
      data: {
        dayId,
        type: dto.type,
        priority: dto.priority ?? 'PRIMARY',
        order: dto.order,
        notes: dto.notes,
      },
    });
  }

  async updateMeal(userId: string, mealId: string, dto: UpdateDietMealDto) {
    try {
      return await this.prisma.dietMeal.update({
        where: { id: mealId, day: { plan: { coach: { userId } } } },
        data: this.pick(dto, MEAL_UPDATABLE),
      });
    } catch (e) {
      if (this.hasCode(e, 'P2025')) throw new NotFoundException('وعده یافت نشد یا متعلق به شما نیست');
      throw e;
    }
  }

  async deleteMeal(userId: string, mealId: string) {
    const { count } = await this.prisma.dietMeal.deleteMany({
      where: { id: mealId, day: { plan: { coach: { userId } } } },
    });
    if (!count) throw new NotFoundException('وعده یافت نشد یا متعلق به شما نیست');
    return { success: true };
  }

  // ───────── Coach: Meal item ─────────

  async addMealItem(userId: string, mealId: string, dto: CreateDietMealItemDto) {
    const [meal, food] = await Promise.all([
      this.prisma.dietMeal.findFirst({
        where: { id: mealId, day: { plan: { coach: { userId } } } },
        select: { id: true },
      }),
      this.prisma.food.findFirst({
        where: { id: dto.foodId, isActive: true },
        select: { id: true },
      }),
    ]);
    if (!meal) throw new NotFoundException('وعده یافت نشد یا متعلق به شما نیست');
    if (!food) throw new BadRequestException('غذا یافت نشد یا غیرفعال است');

    const item = await this.prisma.dietMealItem.create({
      data: {
        mealId,
        foodId: dto.foodId,
        quantityGrams: dto.quantityGrams,
        notes: dto.notes,
      },
    });
    return { ...item, quantityGrams: toNum(item.quantityGrams) };
  }

  async updateMealItem(userId: string, itemId: string, dto: UpdateDietMealItemDto) {
    if (dto.foodId) {
      const food = await this.prisma.food.findFirst({
        where: { id: dto.foodId, isActive: true },
        select: { id: true },
      });
      if (!food) throw new BadRequestException('غذا یافت نشد یا غیرفعال است');
    }

    try {
      const item = await this.prisma.dietMealItem.update({
        where: { id: itemId, meal: { day: { plan: { coach: { userId } } } } },
        data: this.pick(dto, ITEM_UPDATABLE),
      });
      return { ...item, quantityGrams: toNum(item.quantityGrams) };
    } catch (e) {
      if (this.hasCode(e, 'P2025')) throw new NotFoundException('آیتم یافت نشد یا متعلق به شما نیست');
      throw e;
    }
  }

  async deleteMealItem(userId: string, itemId: string) {
    const { count } = await this.prisma.dietMealItem.deleteMany({
      where: { id: itemId, meal: { day: { plan: { coach: { userId } } } } },
    });
    if (!count) throw new NotFoundException('آیتم یافت نشد یا متعلق به شما نیست');
    return { success: true };
  }
}