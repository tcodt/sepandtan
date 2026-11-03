import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import {
  CreateDietPlanDto, UpdateDietPlanDto,
  CreateDietDayDto, UpdateDietDayDto,
  CreateDietMealDto, UpdateDietMealDto,
  CreateDietMealItemDto, UpdateDietMealItemDto,
} from './dto/diet.dto.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';

@Injectable()
export class DietService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getLimit(limit?: any) {
    return Math.max(1, Number(limit) || Number(this.configService.get('limit.coach')) || 10);
  }

  private async resolveCoachId(userId: string): Promise<string> {
    const coach = await this.prisma.coach.findUnique({ where: { userId }, select: { id: true } });
    if (!coach) throw new NotFoundException('حساب مربی یافت نشد');
    return coach.id;
  }

  // ============ Plan ============

  async getPlans(query: QueryDefaultDto, onlyPublished = true) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = onlyPublished ? { isPublished: true } : {};

    const [data, count] = await Promise.all([
      this.prisma.dietPlan.findMany({
        where,
        skip, take: limitPage,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dietPlan.count({ where }),
    ]);
    return { dietPlans: data, pagination: pagination(count, page, limitPage) };
  }

  async getPlan(id: string) {
    const plan = await this.prisma.dietPlan.findUnique({
      where: { id },
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
          include: {
            meals: {
              orderBy: { order: 'asc' },
              include: { items: { include: { food: true } } },
            },
          },
        },
        trainingGoal: true,
        coach: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!plan) throw new NotFoundException('برنامه غذایی یافت نشد');
    return plan;
  }

  async createPlan(userId: string, dto: CreateDietPlanDto) {
    const coachId = await this.resolveCoachId(userId);
    return this.prisma.dietPlan.create({
      data: {
        coachId,
        title: dto.title,
        description: dto.description,
        coverImage: dto.coverImage,
        price: dto.price,
        discountPrice: dto.discountPrice,
        source: dto.source ?? 'COACH',
        trainingGoalId: dto.trainingGoalId,
        targetCalories: dto.targetCalories,
        targetProteinG: dto.targetProteinG,
        targetCarbsG: dto.targetCarbsG,
        targetFatG: dto.targetFatG,
        durationWeeks: dto.durationWeeks,
        discountExpired: dto.discountExpired ? new Date(dto.discountExpired) : null,
      },
    });
  }

  async updatePlan(userId: string, id: string, dto: UpdateDietPlanDto) {
    await this.checkPlanOwner(userId, id);
    const data: any = { ...dto };
    if (dto.discountExpired) data.discountExpired = new Date(dto.discountExpired);
    return this.prisma.dietPlan.update({ where: { id }, data });
  }

  async deletePlan(userId: string, id: string) {
    await this.checkPlanOwner(userId, id);
    await this.prisma.dietPlan.delete({ where: { id } });
    return { success: true };
  }

  async togglePublish(userId: string, id: string) {
    await this.checkPlanOwner(userId, id);
    const plan = await this.prisma.dietPlan.findUnique({ where: { id }, select: { isPublished: true } });
    return this.prisma.dietPlan.update({ where: { id }, data: { isPublished: !plan!.isPublished } });
  }

  private async checkPlanOwner(userId: string, planId: string) {
    const coachId = await this.resolveCoachId(userId);
    const plan = await this.prisma.dietPlan.findFirst({ where: { id: planId, coachId } });
    if (!plan) throw new NotFoundException('برنامه غذایی یافت نشد یا متعلق به شما نیست');
  }

  // ============ Day ============

  async addDay(userId: string, planId: string, dto: CreateDietDayDto) {
    await this.checkPlanOwner(userId, planId);
    const exists = await this.prisma.dietDay.findUnique({
      where: { planId_dayIndex: { planId, dayIndex: dto.dayIndex } },
    });
    if (exists) throw new BadRequestException('این روز قبلاً ثبت شده');
    return this.prisma.dietDay.create({ data: { planId, ...dto } });
  }

  async updateDay(userId: string, dayId: string, dto: UpdateDietDayDto) {
    await this.checkDayOwner(userId, dayId);
    return this.prisma.dietDay.update({ where: { id: dayId }, data: dto });
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
    });
    if (!day) throw new NotFoundException('روز یافت نشد یا متعلق به شما نیست');
  }

  // ============ Meal ============

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
    });
    if (!meal) throw new NotFoundException('وعده یافت نشد یا متعلق به شما نیست');
  }

  // ============ Meal Item ============

  async addMealItem(userId: string, mealId: string, dto: CreateDietMealItemDto) {
    await this.checkMealOwner(userId, mealId);
    const food = await this.prisma.food.findFirst({ where: { id: dto.foodId, isActive: true } });
    if (!food) throw new BadRequestException('غذا یافت نشد یا غیرفعال است');
    return this.prisma.dietMealItem.create({
      data: { mealId, foodId: dto.foodId, quantityGrams: dto.quantityGrams, notes: dto.notes },
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
    });
    if (!item) throw new NotFoundException('آیتم یافت نشد یا متعلق به شما نیست');
  }

  // ============ Coach Plans (لیست برنامه‌های من) ============

  async getMyPlans(userId: string, query: QueryDefaultDto) {
    const coachId = await this.resolveCoachId(userId);
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;

    const where = { coachId };
    const [data, count] = await Promise.all([
      this.prisma.dietPlan.findMany({
        where, skip, take: limitPage, orderBy: { createdAt: 'desc' },
      }),
      this.prisma.dietPlan.count({ where }),
    ]);
    return { dietPlans: data, pagination: pagination(count, page, limitPage) };
  }
}