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
  CreateDietDayDto, UpdateDietDayDto,
  CreateDietMealDto, UpdateDietMealDto,
  CreateDietMealItemDto, UpdateDietMealItemDto,
} from './dto/diet.dto.js';

@Injectable()
export class DietService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getLimit(limit?: number) {
    return Math.max(1, Number(limit) || Number(this.configService.get('limit.coach')) || 10);
  }

  private async resolveCoachId(userId: string) {
    const coach = await this.prisma.coach.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!coach) throw new NotFoundException('حساب مربی یافت نشد');
    return coach.id;
  }

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
      coach: { select: { id: true, title: true, slug: true } },
      trainingGoal: { select: { id: true, title: true, slug: true } },
    } as const;
  }

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

  private assertWeekday(w: number) {
    if (!Number.isInteger(w) || w < 0 || w > 6) {
      throw new BadRequestException('weekday باید ۰ تا ۶ باشد');
    }
  }

  // ─── Public ───

  async getPlans(query: QueryDefaultDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = { isPublished: true };

    const [data, count] = await Promise.all([
      this.prisma.dietPlan.findMany({
        where, skip, take: limitPage,
        orderBy: [{ avgRating: 'desc' }, { createdAt: 'desc' }],
        select: this.planSummarySelect(),
      }),
      this.prisma.dietPlan.count({ where }),
    ]);
    return { dietPlans: data, pagination: pagination(count, page, limitPage) };
  }

  async getPlan(id: string) {
    const plan = await this.prisma.dietPlan.findUnique({
      where: { id },
      select: {
        ...this.planSummarySelect(),
        coachId: true,
        createdAt: true,
        updatedAt: true,
        dietPhases: {
          orderBy: [{ order: 'asc' }, { startWeek: 'asc' }],
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
                        food: {
                          select: {
                            id: true,
                            title: true,
                            // فیلدهای کالری/ماکرو Food را با schema خودت یکی کن
                            calories: true,
                            proteinG: true,
                            carbsG: true,
                            fatG: true,
                          },
                        },
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
    if (!plan) throw new NotFoundException('برنامه غذایی یافت نشد');
    return plan;
  }

  // ─── Coach plans ───

  async getMyPlans(userId: string, query: QueryDefaultDto) {
    const coachId = await this.resolveCoachId(userId);
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = { coachId };

    const [data, count] = await Promise.all([
      this.prisma.dietPlan.findMany({
        where, skip, take: limitPage,
        orderBy: { updatedAt: 'desc' },
        select: this.planSummarySelect(),
      }),
      this.prisma.dietPlan.count({ where }),
    ]);
    return { dietPlans: data, pagination: pagination(count, page, limitPage) };
  }

  async createPlan(userId: string, dto: CreateDietPlanDto) {
    const coachId = await this.resolveCoachId(userId);
    return this.prisma.dietPlan.create({
      data: { ...dto, coachId, isPublished: false },
      select: this.planSummarySelect(),
    });
  }

  async updatePlan(userId: string, id: string, dto: UpdateDietPlanDto) {
    await this.checkPlanOwner(userId, id);
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
    return this.prisma.dietPlan.update({
      where: { id },
      data: dto,
      select: this.planSummarySelect(),
    });
  }

  async deletePlan(userId: string, id: string) {
    await this.checkPlanOwner(userId, id);
    await this.prisma.dietPlan.delete({ where: { id } });
    return { success: true };
  }

  async togglePublish(userId: string, id: string) {
    await this.checkPlanOwner(userId, id);
    const plan = await this.prisma.dietPlan.findUnique({
      where: { id },
      select: { isPublished: true },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد');
    return this.prisma.dietPlan.update({
      where: { id },
      data: { isPublished: !plan.isPublished },
      select: { id: true, isPublished: true },
    });
  }

  private async checkPlanOwner(userId: string, planId: string) {
    const coachId = await this.resolveCoachId(userId);
    const plan = await this.prisma.dietPlan.findFirst({
      where: { id: planId, coachId },
      select: { id: true, durationWeeks: true },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد یا متعلق به شما نیست');
    return plan;
  }

  // ─── Phase ───

  async addPhase(userId: string, planId: string, dto: CreateDietPhaseDto) {
    const plan = await this.checkPlanOwner(userId, planId);
    this.assertPhaseWindow(plan.durationWeeks, dto.startWeek, dto.endWeek);

    const overlap = await this.prisma.dietPhase.findFirst({
      where: {
        planId,
        startWeek: { lte: dto.endWeek },
        endWeek: { gte: dto.startWeek },
      },
      select: { id: true, title: true },
    });
    if (overlap) {
      throw new BadRequestException(`تداخل با فاز «${overlap.title}»`);
    }

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
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('startWeek تکراری');
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
        select: { id: true },
      });
      if (overlap) throw new BadRequestException('تداخل بازه هفته');
    }

    return this.prisma.dietPhase.update({ where: { id: phaseId }, data: dto });
  }

  async deletePhase(userId: string, phaseId: string) {
    await this.checkPhaseOwner(userId, phaseId);
    await this.prisma.dietPhase.delete({ where: { id: phaseId } });
    return { success: true };
  }

  private async checkPhaseOwner(userId: string, phaseId: string) {
    const coachId = await this.resolveCoachId(userId);
    const phase = await this.prisma.dietPhase.findFirst({
      where: { id: phaseId, plan: { coachId } },
      select: {
        id: true,
        planId: true,
        startWeek: true,
        endWeek: true,
        plan: { select: { durationWeeks: true } },
      },
    });
    if (!phase) throw new NotFoundException('فاز یافت نشد');
    return phase;
  }

  // ─── Day ───

  async addDay(userId: string, planId: string, dto: CreateDietDayDto) {
    await this.checkPlanOwner(userId, planId);
    this.assertWeekday(dto.weekday);

    const phase = await this.prisma.dietPhase.findFirst({
      where: { id: dto.dietPhaseId, planId },
      select: { id: true },
    });
    if (!phase) throw new BadRequestException('فاز به این برنامه تعلق ندارد');

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
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('این weekday در فاز تکراری است');
      throw e;
    }
  }

  async updateDay(userId: string, dayId: string, dto: UpdateDietDayDto) {
    await this.checkDayOwner(userId, dayId);
    if (dto.weekday != null) this.assertWeekday(dto.weekday);
    try {
      return await this.prisma.dietDay.update({ where: { id: dayId }, data: dto });
    } catch (e: any) {
      if (e?.code === 'P2002') throw new ConflictException('weekday تکراری');
      throw e;
    }
  }

  async deleteDay(userId: string, dayId: string) {
    await this.checkDayOwner(userId, dayId);
    await this.prisma.dietDay.delete({ where: { id: dayId } });
    return { success: true };
  }

  private async checkDayOwner(userId: string, dayId: string) {
    const coachId = await this.resolveCoachId(userId);
    const day = await this.prisma.dietDay.findFirst({
      where: { id: dayId, plan: { coachId } },
      select: { id: true },
    });
    if (!day) throw new NotFoundException('روز یافت نشد');
    return day;
  }

  // ─── Meal ───

  async addMeal(userId: string, dayId: string, dto: CreateDietMealDto) {
    await this.checkDayOwner(userId, dayId);
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
    await this.checkMealOwner(userId, mealId);
    return this.prisma.dietMeal.update({ where: { id: mealId }, data: dto });
  }

  async deleteMeal(userId: string, mealId: string) {
    await this.checkMealOwner(userId, mealId);
    await this.prisma.dietMeal.delete({ where: { id: mealId } });
    return { success: true };
  }

  private async checkMealOwner(userId: string, mealId: string) {
    const coachId = await this.resolveCoachId(userId);
    const meal = await this.prisma.dietMeal.findFirst({
      where: { id: mealId, day: { plan: { coachId } } },
      select: { id: true },
    });
    if (!meal) throw new NotFoundException('وعده یافت نشد');
    return meal;
  }

  // ─── Meal item ───

  async addMealItem(userId: string, mealId: string, dto: CreateDietMealItemDto) {
    await this.checkMealOwner(userId, mealId);
    const food = await this.prisma.food.findFirst({
      where: { id: dto.foodId },
      select: { id: true },
    });
    if (!food) throw new BadRequestException('غذا معتبر نیست');

    return this.prisma.dietMealItem.create({
      data: {
        mealId,
        foodId: dto.foodId,
        quantityGrams: dto.quantityGrams,
        notes: dto.notes,
      },
    });
  }

  async updateMealItem(userId: string, itemId: string, dto: UpdateDietMealItemDto) {
    await this.checkItemOwner(userId, itemId);
    return this.prisma.dietMealItem.update({ where: { id: itemId }, data: dto });
  }

  async deleteMealItem(userId: string, itemId: string) {
    await this.checkItemOwner(userId, itemId);
    await this.prisma.dietMealItem.delete({ where: { id: itemId } });
    return { success: true };
  }

  private async checkItemOwner(userId: string, itemId: string) {
    const coachId = await this.resolveCoachId(userId);
    const item = await this.prisma.dietMealItem.findFirst({
      where: { id: itemId, meal: { day: { plan: { coachId } } } },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('آیتم یافت نشد');
    return item;
  }
}