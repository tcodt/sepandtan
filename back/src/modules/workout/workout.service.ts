import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import {
  CreateWorkoutPlanDto, UpdateWorkoutPlanDto,
  CreateWorkoutDayDto, UpdateWorkoutDayDto,
  CreateWorkoutExerciseDto, UpdateWorkoutExerciseDto,
} from './dto/workout.dto.js';

@Injectable()
export class WorkoutService {
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

  // ============ Plan: Public ============

  async getPlans(query: QueryDefaultDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = { isPublished: true };

    const [data, count] = await Promise.all([
      this.prisma.workoutPlan.findMany({
        where, skip, take: limitPage,
        orderBy: [{ avgRating: 'desc' }, { createdAt: 'desc' }],
        select: this.planSummarySelect(),
      }),
      this.prisma.workoutPlan.count({ where }),
    ]);
    return { workoutPlans: data, pagination: pagination(count, page, limitPage) };
  }

  async getPlan(id: string) {
    const plan = await this.prisma.workoutPlan.findUnique({
      where: { id },
      include: {
        days: {
          orderBy: { dayIndex: 'asc' },
          include: {
            exercises: {
              orderBy: { order: 'asc' },
              include: {
                exercise: {
                  select: { id: true, title: true, slug: true, gif: true, video: true, level: true },
                },
              },
            },
          },
        },
        trainingGoal: true,
        coach: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!plan) throw new NotFoundException('برنامه تمرینی یافت نشد');
    return plan;
  }

  // ============ Plan: Coach ============

  async getMyPlans(userId: string, query: QueryDefaultDto) {
    const coachId = await this.resolveCoachId(userId);
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = { coachId };

    const [data, count] = await Promise.all([
      this.prisma.workoutPlan.findMany({
        where, skip, take: limitPage,
        orderBy: { createdAt: 'desc' },
        select: this.planSummarySelect(),
      }),
      this.prisma.workoutPlan.count({ where }),
    ]);
    return { workoutPlans: data, pagination: pagination(count, page, limitPage) };
  }

  async createPlan(userId: string, dto: CreateWorkoutPlanDto) {
    const coachId = await this.resolveCoachId(userId);
    return this.prisma.workoutPlan.create({
      data: {
        coachId,
        title: dto.title,
        description: dto.description,
        coverImage: dto.coverImage,
        price: dto.price,
        discountPrice: dto.discountPrice,
        minAge: dto.minAge,
        maxAge: dto.maxAge,
        note: dto.note,
        durationWeeks: dto.durationWeeks,
        source: dto.source ?? 'COACH',
        trainingGoalId: dto.trainingGoalId,
        activityLevel: dto.activityLevel,
        experienceLevel: dto.experienceLevel,
        gender: dto.gender,
        trainingLocation: dto.trainingLocation,
        trainingDaysPerWeek: dto.trainingDaysPerWeek,
        requiredEquipment: dto.requiredEquipment ?? [],
        discountExpired: dto.discountExpired ? new Date(dto.discountExpired) : null,
        dietPlanId: dto.dietPlanId,
      },
    });
  }

  async updatePlan(userId: string, id: string, dto: UpdateWorkoutPlanDto) {
    await this.checkPlanOwner(userId, id);
    const data: any = { ...dto };
    if (dto.discountExpired) data.discountExpired = new Date(dto.discountExpired);
    return this.prisma.workoutPlan.update({ where: { id }, data });
  }

  async deletePlan(userId: string, id: string) {
    await this.checkPlanOwner(userId, id);
    await this.prisma.workoutPlan.delete({ where: { id } });
    return { success: true };
  }

  async togglePublish(userId: string, id: string) {
    await this.checkPlanOwner(userId, id);
    const plan = await this.prisma.workoutPlan.findUnique({ where: { id }, select: { isPublished: true } });
    return this.prisma.workoutPlan.update({ where: { id }, data: { isPublished: !plan!.isPublished } });
  }

  private async checkPlanOwner(userId: string, planId: string) {
    const coachId = await this.resolveCoachId(userId);
    const plan = await this.prisma.workoutPlan.findFirst({ where: { id: planId, coachId }, select: { id: true } });
    if (!plan) throw new NotFoundException('برنامه تمرینی یافت نشد یا متعلق به شما نیست');
  }

  // ============ Day ============

  async addDay(userId: string, planId: string, dto: CreateWorkoutDayDto) {
    await this.checkPlanOwner(userId, planId);
    const exists = await this.prisma.workoutDay.findUnique({
      where: { planId_dayIndex: { planId, dayIndex: dto.dayIndex } },
      select: { id: true },
    });
    if (exists) throw new ConflictException('این روز قبلاً ثبت شده');
    return this.prisma.workoutDay.create({ data: { planId, ...dto } });
  }

  async updateDay(userId: string, dayId: string, dto: UpdateWorkoutDayDto) {
    await this.checkDayOwner(userId, dayId);
    return this.prisma.workoutDay.update({ where: { id: dayId }, data: dto });
  }

  async deleteDay(userId: string, dayId: string) {
    await this.checkDayOwner(userId, dayId);
    await this.prisma.workoutDay.delete({ where: { id: dayId } });
    return { success: true };
  }

  private async checkDayOwner(userId: string, dayId: string) {
    const coachId = await this.resolveCoachId(userId);
    const day = await this.prisma.workoutDay.findFirst({
      where: { id: dayId, plan: { coachId } },
      select: { id: true },
    });
    if (!day) throw new NotFoundException('روز یافت نشد یا متعلق به شما نیست');
  }

  // ============ Exercise Item ============

  async addExercise(userId: string, dayId: string, dto: CreateWorkoutExerciseDto) {
    await this.checkDayOwner(userId, dayId);
    const exercise = await this.prisma.exercise.findFirst({
      where: { id: dto.exerciseId, isActive: true },
      select: { id: true },
    });
    if (!exercise) throw new BadRequestException('حرکت یافت نشد یا غیرفعال است');
    return this.prisma.workoutDayExercise.create({
      data: { dayId, ...dto },
    });
  }

  async updateExercise(userId: string, itemId: string, dto: UpdateWorkoutExerciseDto) {
    await this.checkItemOwner(userId, itemId);
    return this.prisma.workoutDayExercise.update({ where: { id: itemId }, data: dto });
  }

  async deleteExercise(userId: string, itemId: string) {
    await this.checkItemOwner(userId, itemId);
    await this.prisma.workoutDayExercise.delete({ where: { id: itemId } });
    return { success: true };
  }

  private async checkItemOwner(userId: string, itemId: string) {
    const coachId = await this.resolveCoachId(userId);
    const item = await this.prisma.workoutDayExercise.findFirst({
      where: { id: itemId, day: { plan: { coachId } } },
      select: { id: true },
    });
    if (!item) throw new NotFoundException('حرکت یافت نشد یا متعلق به شما نیست');
  }

  // ============ Helper ============

  private planSummarySelect() {
    return {
      id: true, title: true, coverImage: true, price: true, discountPrice: true,
      avgRating: true, countRating: true, isPublished: true,
      durationWeeks: true, trainingDaysPerWeek: true, createdAt: true,
    };
  }
}