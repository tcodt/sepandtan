import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import { CreateUserLogDto, UpdateUserLogDto } from './dto/user-log.dto.js';

@Injectable()
export class UserLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  private getLimit(limit?: any) {
    return Math.max(1, Number(limit) || Number(this.configService.get('limit.coach')) || 10);
  }

  /** تبدیل تاریخ به ابتدای روز (UTC) — برای unique constraint */
  private normalizeDate(input: string | Date): Date {
    const d = new Date(input);
    if (isNaN(d.getTime())) throw new BadRequestException('تاریخ نامعتبر است');
    return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  }

  // ============ CRUD ============

  async create(userId: string, dto: CreateUserLogDto) {
    const date = this.normalizeDate(dto.date);

    // چک تکراری (unique user+date)
    const exists = await this.prisma.userLog.findUnique({
      where: { userId_date: { userId, date } },
      select: { id: true },
    });
    if (exists) throw new ConflictException('برای این تاریخ قبلاً لاگ ثبت شده');

    // چک userPlanId در صورت وجود
    if (dto.userPlanId) {
      const plan = await this.prisma.userPlan.findFirst({
        where: { id: dto.userPlanId, userId },
        select: { id: true },
      });
      if (!plan) throw new NotFoundException('برنامه یافت نشد یا متعلق به شما نیست');
    }

    const doneExercises = dto.doneExerciseIds?.length ?? 0;
    const doneMeals = dto.doneMealIds?.length ?? 0;
    const plannedExercises = dto.doneExerciseIds?.length ?? 0;
    const plannedMeals = dto.doneMealIds?.length ?? 0;

    return this.prisma.userLog.create({
      data: {
        userId,
        userPlanId: dto.userPlanId,
        date,
        weightKg: dto.weightKg,
        doneExerciseIds: dto.doneExerciseIds ?? [],
        doneExercises,
        plannedExerciseIds: [],
        plannedExercises,
        extraExercises: dto.extraExercises ?? [],
        caloriesBurned: dto.caloriesBurned,
        doneMealIds: dto.doneMealIds ?? [],
        doneMeals,
        plannedMealIds: [],
        plannedMeals,
        extraMeals: dto.extraMeals ?? [],
        caloriesPlanned: dto.caloriesPlanned,
        caloriesConsumed: dto.caloriesConsumed,
        proteinG: dto.proteinG,
        carbsG: dto.carbsG,
        fatG: dto.fatG,
        userNote: dto.userNote,
      },
    });
  }

  async update(userId: string, id: string, dto: UpdateUserLogDto) {
    await this.checkOwner(userId, id);

    const data: any = { ...dto };
    if (dto.date) data.date = this.normalizeDate(dto.date);
    if (dto.doneExerciseIds) data.doneExercises = dto.doneExerciseIds.length;
    if (dto.doneMealIds) data.doneMeals = dto.doneMealIds.length;

    return this.prisma.userLog.update({ where: { id }, data });
  }

  async delete(userId: string, id: string) {
    await this.checkOwner(userId, id);
    await this.prisma.userLog.delete({ where: { id } });
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

  // ============ Helper ============

  private async checkOwner(userId: string, id: string) {
    const found = await this.prisma.userLog.findFirst({
      where: { id, userId },
      select: { id: true },
    });
    if (!found) throw new NotFoundException('لاگ یافت نشد یا متعلق به شما نیست');
  }
}