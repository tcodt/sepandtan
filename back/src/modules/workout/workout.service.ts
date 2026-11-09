import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import {
  CreateWorkoutPlanDto,
  UpdateWorkoutPlanDto,
  CreateWorkoutPhaseDto,
  UpdateWorkoutPhaseDto,
  CreateWorkoutDayDto,
  UpdateWorkoutDayDto,
  CreateWorkoutExerciseDto,
  UpdateWorkoutExerciseDto,
  SortOptionWorkoutPlan,
  SearchWorkOutUser,
  SearchWorkOutCoach,
  SearchWorkOutAdmin,
} from './dto/workout.dto.js';
import { Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class WorkoutService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  private buildPlanOrderBy(
    sortBy: SortOptionWorkoutPlan,
  ): Prisma.WorkoutPlanOrderByWithRelationInput {
    switch (sortBy) {
      case SortOptionWorkoutPlan.OLDEST:
        return { createdAt: 'asc' }
      case SortOptionWorkoutPlan.NEWEST:
        return { createdAt: 'desc' }
      case SortOptionWorkoutPlan.MORE_PRICE:
        return {
          price: 'desc'
        }
      case SortOptionWorkoutPlan.LOW_PRICE:
        return {
          price: 'asc'
        }
      case SortOptionWorkoutPlan.MORE_RATE:
        return {
          avgRating: 'desc'
        }
      case SortOptionWorkoutPlan.LOW_RATE:
        return {
          avgRating: 'asc'
        }
      default:
        return { createdAt: 'desc' }
    }
  }

  private getLimit(limit?: number) {
    return Math.max(
      1,
      Number(limit) || Number(this.configService.get('limit.workout')) || 10,
    );
  }

  private async resolveCoachId(userId: string): Promise<string> {
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
      avgRating: true,
      countRating: true,
      isPublished: true,
      gender: true,
      experienceLevel: true,
      trainingLocation: true,
      trainingDaysPerWeek: true,
      updatedAt: true,
      dietPlan: { select: { id: true, title: true } },
      coach: { select: { id: true, title: true, slug: true } },
      trainingGoal: { select: { id: true, title: true, logo: true } },
    } as const;
  }

  private planSummarySelectCoach() {
    return {
      id: true,
      title: true,
      description: true,
      coverImage: true,
      price: true,
      discountPrice: true,
      discountExpired: true,
      durationWeeks: true,
      avgRating: true,
      countRating: true,
      isPublished: true,
      gender: true,
      experienceLevel: true,
      trainingLocation: true,
      trainingDaysPerWeek: true,
      updatedAt: true,
      dietPlan: { select: { id: true, title: true } },
      trainingGoal: { select: { id: true, title: true, logo: true } },
    } as const;
  }

  private dayExerciseInclude() {
    return {
      exercises: {
        orderBy: { order: 'asc' as const },
        include: {
          exercise: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
      },
    };
  }

  /** حاشیه ۱ هفته: endWeek می‌تواند تا durationWeeks+1 برود */
  private assertPhaseWindow(
    durationWeeks: number | null | undefined,
    startWeek: number,
    endWeek: number,
  ) {
    if (startWeek < 1 || endWeek < startWeek) {
      throw new BadRequestException('بازه هفته نامعتبر است');
    }
    if (durationWeeks != null) {
      const maxAllowed = durationWeeks + 1;
      if (endWeek > maxAllowed) {
        throw new BadRequestException(
          `پایان فاز (هفته ${endWeek}) از مدت برنامه+۱ (${maxAllowed}) بیشتر است`,
        );
      }
    }
  }

  private assertWeekday(weekday: number) {
    if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
      throw new BadRequestException('weekday باید عدد صحیح ۰ تا ۶ باشد');
    }
  }

  // ─── Public ───

  async getPlans(query: SearchWorkOutUser) {
    const { gender, limit, page = 1, sortBy, title } = query
    const limitPage = this.getLimit(limit);
    const skip = (page - 1) * limitPage;
    const where = {
      isPublished: true,
      ...(gender && gender !== undefined && { gender }),
      ...(title && title !== undefined && { title: { contains: title, mode: 'insensitive' as const } }),
    };
    const orderBy = this.buildPlanOrderBy(sortBy ?? SortOptionWorkoutPlan.MORE_RATE)
    const [data, count] = await Promise.all([
      this.prisma.workoutPlan.findMany({
        where,
        skip,
        take: limitPage,
        orderBy: [orderBy, { createdAt: 'desc' }],
        select: this.planSummarySelect(),
      }),
      this.prisma.workoutPlan.count({ where }),
    ]);

    return {
      workoutPlans: data,
      pagination: pagination(count, page, limitPage),
    };
  }

  async getPlan(id: string) {
    const plan = await this.prisma.workoutPlan.findUnique({
      where: { id },
      select: {
        _count: { select: { workoutPhases: true, days: true } },
        ...this.planSummarySelect(),
        note: true,
        minAge: true,
        maxAge: true,
        source: true,
        equipment: true,
        activityLevel: true,
        coachId: true,
        dietPlanId: true,
        createdAt: true,
        updatedAt: true,
        workoutPhases: {
          take: 1,
          orderBy: [{ order: 'asc' }, { startWeek: 'asc' }],
          select: {
            id: true,
            title: true,
            order: true,
            days: {
              take: 3,
              orderBy: { weekday: 'asc' },
              select: {
                id: true,
                weekday: true,
                title: true,
                isRestDay: true,
                notes: true,
                exercises: {
                  select: {
                    id: true,
                    sets: true,
                    order: true,
                    reps: true,
                    durationSec: true,
                    notes: true,
                    restSec: true,
                    exercise: {
                      select: {
                        id: true,
                        title: true,
                        slug: true,
                        level: true,
                        coverImg: true
                      },
                    },
                  },
                  take: 3,
                  orderBy: { order: 'asc' as const },
                },
              },
            },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('برنامه تمرینی یافت نشد');
    return plan;
  }

  // ─── Coach plans ───
  async getMyPlan(id: string) {
    const plan = await this.prisma.workoutPlan.findUnique({
      where: { id },
      select: {
        ...this.planSummarySelectCoach(),
        note: true,
        minAge: true,
        maxAge: true,
        source: true,
        equipment: true,
        activityLevel: true,
        coachId: true,
        dietPlanId: true,
        createdAt: true,
        updatedAt: true,
        workoutPhases: {
          orderBy: [{ order: 'asc' }, { startWeek: 'asc' }],
          select: {
            id: true,
            title: true,
            startWeek: true,
            endWeek: true,
            order: true
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('برنامه تمرینی یافت نشد');
    return plan;
  }

  async getMyPlans(userId: string, query: SearchWorkOutCoach) {
    const { gender, limit, page = 1, sortBy, title, isPublished } = query
    const coachId = await this.resolveCoachId(userId);
    const limitPage = this.getLimit(limit);
    const skip = (page - 1) * limitPage;
    const where = {
      coachId,
      ...(isPublished !== undefined && { isPublished }),
      ...(gender && gender !== undefined && { gender }),
      ...(title && title !== undefined && { title: { contains: title, mode: 'insensitive' as const } })
    }

    const orderBy = this.buildPlanOrderBy(sortBy ?? SortOptionWorkoutPlan.NEWEST)
    const [data, count] = await Promise.all([
      this.prisma.workoutPlan.findMany({
        where,
        skip,
        take: limitPage,
        orderBy: orderBy,
        select: this.planSummarySelectCoach(),
      }),
      this.prisma.workoutPlan.count({ where }),
    ]);

    return {
      workoutPlans: data,
      pagination: pagination(count, page, limitPage),
    };
  }

  async getAdminPlans(query: SearchWorkOutAdmin) {
    const { gender, limit, page = 1, sortBy, title, source, isPublished, coachId } = query
    const limitPage = this.getLimit(limit);
    const skip = (page - 1) * limitPage;
    const where = {
      ...(coachId && coachId !== undefined && { coachId }),
      ...(isPublished !== undefined && { isPublished }),
      ...(gender && gender !== undefined && { gender }),
      ...(source && source !== undefined && { source }),
      ...(title && title !== undefined && { title: { contains: title, mode: 'insensitive' as const } })
    }
    const orderBy = this.buildPlanOrderBy(sortBy ?? SortOptionWorkoutPlan.NEWEST)
    const [data, count] = await Promise.all([
      this.prisma.workoutPlan.findMany({
        where,
        skip,
        take: limitPage,
        orderBy: orderBy,
        select: this.planSummarySelect(),
      }),
      this.prisma.workoutPlan.count({ where }),
    ]);
    return {
      workoutPlans: data,
      pagination: pagination(count, page, limitPage),
    };
  }

  async createPlan(userId: string, dto: CreateWorkoutPlanDto) {
    const coachId = await this.resolveCoachId(userId);
    await this.prisma.workoutPlan.create({
      data: {
        ...dto,
        coachId,
        isPublished: false,
        ...(dto.equipmentIds?.length && {
          equipment: { connect: dto.equipmentIds.map((id) => ({ id })) },
        })
      },
    });
    return { success: true }
  }

  async updatePlan(userId: string, id: string, dto: UpdateWorkoutPlanDto) {
    await this.checkPlanOwner(userId, id);

    if (dto.durationWeeks != null) {
      const maxEnd = await this.prisma.workoutPhase.aggregate({
        where: { planId: id },
        _max: { endWeek: true },
      });
      const end = maxEnd._max.endWeek;
      if (end != null && end > dto.durationWeeks + 1) {
        throw new BadRequestException(
          `فازها تا هفته ${end} هستند؛ durationWeeks را حداقل ${end - 1} بگذار یا فازها را کوتاه کن`,
        );
      }
    }

    await this.prisma.workoutPlan.update({
      where: { id },
      data: dto,
      select: this.planSummarySelect(),
    });
    return { success: true };
  }

  async deletePlan(userId: string, id: string) {
    await this.checkPlanOwner(userId, id);
    await this.prisma.workoutPlan.delete({ where: { id } });
    return { success: true };
  }

  async togglePublish(userId: string, id: string) {
    await this.checkPlanOwner(userId, id);
    const plan = await this.prisma.workoutPlan.findUnique({
      where: { id },
      select: { isPublished: true },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد');

    const data = await this.prisma.workoutPlan.update({
      where: { id },
      data: { isPublished: !plan.isPublished },
      select: { id: true, isPublished: true },
    });
    return { success: true, message: !data.isPublished ? 'انتشار برنامه متوقف شد' : 'برنامه منتشر شد' }
  }

  private async checkPlanOwner(userId: string, planId: string) {
    const coachId = await this.resolveCoachId(userId);
    const plan = await this.prisma.workoutPlan.findFirst({
      where: { id: planId, coachId },
      select: { id: true, durationWeeks: true },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد یا متعلق به شما نیست');
    return plan;
  }

  // ─── Phase ───
  async getPhase(id: string) {
    return this.prisma.workoutPhase.findUnique({
      where: {
        id
      },
      select: {
        id: true,
        title: true,
        startWeek: true,
        endWeek: true,
        order: true,
        days: {
          orderBy: { weekday: 'asc' },
          select: {
            id: true,
            weekday: true,
            title: true,
            isRestDay: true,
            notes: true,
            ...this.dayExerciseInclude(),
          },
        },
      }
    })
  }

  async addPhase(userId: string, planId: string, dto: CreateWorkoutPhaseDto) {
    const plan = await this.checkPlanOwner(userId, planId);
    this.assertPhaseWindow(plan.durationWeeks, dto.startWeek, dto.endWeek);

    // تداخل بازه با فازهای موجود (نرم: فقط overlap خطا)
    const overlap = await this.prisma.workoutPhase.findFirst({
      where: {
        planId,
        startWeek: { lte: dto.endWeek },
        endWeek: { gte: dto.startWeek },
      },
      select: { id: true, title: true },
    });
    if (overlap) {
      throw new BadRequestException(
        `بازه هفته با فاز «${overlap.title}» تداخل دارد`,
      );
    }

    try {
      await this.prisma.workoutPhase.create({
        data: {
          planId,
          title: dto.title,
          startWeek: dto.startWeek,
          endWeek: dto.endWeek,
          order: dto.order ?? dto.startWeek,
        },
      });
      return { success: true };
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('فاز تکراری برای این startWeek');
      }
      throw e;
    }
  }

  async updatePhase(userId: string, phaseId: string, dto: UpdateWorkoutPhaseDto,) {
    const phase = await this.checkPhaseOwner(userId, phaseId);
    const start = dto.startWeek ?? phase.startWeek;
    const end = dto.endWeek ?? phase.endWeek;
    this.assertPhaseWindow(phase.plan.durationWeeks, start, end);

    if (dto.startWeek != null || dto.endWeek != null) {
      const overlap = await this.prisma.workoutPhase.findFirst({
        where: {
          planId: phase.planId,
          id: { not: phaseId },
          startWeek: { lte: end },
          endWeek: { gte: start },
        },
        select: { id: true },
      });
      if (overlap) {
        throw new BadRequestException('بازه هفته با فاز دیگر تداخل دارد');
      }
    }

    await this.prisma.workoutPhase.update({
      where: { id: phaseId },
      data: dto,
    });
    return { success: true };
  }

  async deletePhase(userId: string, phaseId: string) {
    await this.checkPhaseOwner(userId, phaseId);
    await this.prisma.workoutPhase.delete({ where: { id: phaseId } });
    return { success: true };
  }

  private async checkPhaseOwner(userId: string, phaseId: string) {
    const coachId = await this.resolveCoachId(userId);
    const phase = await this.prisma.workoutPhase.findFirst({
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

  // ─── Day (داخل فاز) ───

  async addDay(userId: string, planId: string, dto: CreateWorkoutDayDto) {
    await this.checkPlanOwner(userId, planId);
    this.assertWeekday(dto.weekday);

    if (!dto.workoutPhaseId) {
      throw new BadRequestException('workoutPhaseId الزامی است');
    }

    const phase = await this.prisma.workoutPhase.findFirst({
      where: { id: dto.workoutPhaseId, planId },
      select: { id: true },
    });
    if (!phase) throw new BadRequestException('فاز به این برنامه تعلق ندارد');

    try {
      await this.prisma.workoutDay.create({
        data: {
          planId,
          workoutPhaseId: dto.workoutPhaseId,
          weekday: dto.weekday,
          title: dto.title,
          isRestDay: dto.isRestDay ?? false,
          notes: dto.notes,
        },
      });
      return { success: true };
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('این روز هفته در این فاز قبلاً ثبت شده');
      }
      throw e;
    }
  }

  async updateDay(userId: string, dayId: string, dto: UpdateWorkoutDayDto) {
    await this.checkDayOwner(userId, dayId);
    if (dto.weekday != null) this.assertWeekday(dto.weekday);

    try {
      await this.prisma.workoutDay.update({
        where: { id: dayId },
        data: dto,
      });
      return { success: true };
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('weekday در این فاز تکراری است');
      }
      throw e;
    }
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
    if (!day) throw new NotFoundException('روز یافت نشد');
    return day;
  }

  // ─── Exercise on day ───

  async addExercise(
    userId: string,
    dayId: string,
    dto: CreateWorkoutExerciseDto,
  ) {
    await this.checkDayOwner(userId, dayId);

    const exercise = await this.prisma.exercise.findFirst({
      where: { id: dto.exerciseId /* , isActive: true */ },
      select: { id: true },
    });
    if (!exercise) throw new BadRequestException('حرکت معتبر نیست');

    try {
      await this.prisma.workoutDayExercise.create({
        data: {
          dayId,
          exerciseId: dto.exerciseId,
          order: dto.order,
          sets: dto.sets,
          reps: dto.reps,
          durationSec: dto.durationSec,
          restSec: dto.restSec,
          notes: dto.notes,
        },
      });
      return { success: true };
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new ConflictException('order تکراری در این روز');
      }
      throw e;
    }
  }

  async updateExercise(
    userId: string,
    itemId: string,
    dto: UpdateWorkoutExerciseDto,
  ) {
    await this.checkItemOwner(userId, itemId);
    await this.prisma.workoutDayExercise.update({
      where: { id: itemId },
      data: dto,
    });
    return { success: true };
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
    if (!item) throw new NotFoundException('آیتم یافت نشد');
    return item;
  }
}