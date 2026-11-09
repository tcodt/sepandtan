import {
  Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import {
  CreatePlanRequestDto, UpdatePlanRequestStatusDto,
  CreateUserPlanDto, UpdateUserPlanDto, CustomizeSnapshotDto,
} from './dto/user-plan.dto.js';

@Injectable()
export class UserPlanService {
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

  // ================= PlanRequest =================

  async createRequest(userId: string, dto: CreatePlanRequestDto) {
    const coach = await this.prisma.coach.findFirst({
      where: { id: dto.coachId, status: 'APPROVED' },
      select: { id: true },
    });
    if (!coach) throw new NotFoundException('مربی یافت نشد یا تأیید نشده');

    return this.prisma.planRequest.create({
      data: {
        userId,
        coachId: dto.coachId,
        workoutTemplateId: dto.workoutTemplateId,
        dietTemplateId: dto.dietTemplateId,
        images: dto.images ?? [],
        note: dto.note,
      },
    });
  }

  async getMyRequests(userId: string, query: QueryDefaultDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = { userId };

    const [data, count] = await Promise.all([
      this.prisma.planRequest.findMany({
        where, skip, take: limitPage,
        orderBy: { createdAt: 'desc' },
        include: { coach: { select: { id: true, title: true, slug: true } } },
      }),
      this.prisma.planRequest.count({ where }),
    ]);
    return { requests: data, pagination: pagination(count, page, limitPage) };
  }

  async getCoachRequests(userId: string, query: QueryDefaultDto) {
    const coachId = await this.resolveCoachId(userId);
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = { coachId };

    const [data, count] = await Promise.all([
      this.prisma.planRequest.findMany({
        where, skip, take: limitPage,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, name: true, phone: true } } },
      }),
      this.prisma.planRequest.count({ where }),
    ]);
    return { requests: data, pagination: pagination(count, page, limitPage) };
  }

  async updateRequestStatus(userId: string, requestId: string, dto: UpdatePlanRequestStatusDto) {
    const coachId = await this.resolveCoachId(userId);
    const req = await this.prisma.planRequest.findFirst({
      where: { id: requestId, coachId },
      select: { id: true, status: true },
    });
    if (!req) throw new NotFoundException('درخواست یافت نشد یا متعلق به شما نیست');
    if (req.status !== 'PENDING') throw new ConflictException('فقط درخواست‌های PENDING قابل تغییر هستند');

    const data: any = { status: dto.status, respondedAt: new Date() };
    if (dto.status === 'REJECTED') data.rejectionReason = dto.rejectionReason;

    return this.prisma.planRequest.update({ where: { id: requestId }, data });
  }

  // ================= UserPlan =================

  async getMyPlans(userId: string, query: QueryDefaultDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = { userId };

    const [data, count] = await Promise.all([
      this.prisma.userPlan.findMany({
        where, skip, take: limitPage,
        orderBy: { createdAt: 'desc' },
        select: this.planSummarySelect(),
      }),
      this.prisma.userPlan.count({ where }),
    ]);
    return { userPlans: data, pagination: pagination(count, page, limitPage) };
  }

  async getPlan(userId: string, id: string, role: string) {
    const where = role === 'ADMIN' || role === 'SUPERADMIN' ? { id } : { id, userId };
    const plan = await this.prisma.userPlan.findFirst({
      where,
      include: {
        workoutPlan: { select: { id: true, title: true, coverImage: true } },
        dietPlan: { select: { id: true, title: true, coverImage: true } },
        coach: { select: { id: true, title: true, slug: true } },
      },
    });
    if (!plan) throw new NotFoundException('برنامه یافت نشد');
    return plan;
  }

  async createPlan(userId: string, dto: CreateUserPlanDto) {
    // چک: حداقل یکی از workoutPlanId یا dietPlanId باید باشد
    if (!dto.workoutPlanId && !dto.dietPlanId && !dto.requestId) {
      throw new BadRequestException('حداقل یکی از workoutPlanId، dietPlanId یا requestId الزامی است');
    }

    // جلوگیری از چند برنامه ACTIVE همزمان برای یک کاربر
    const active = await this.prisma.userPlan.count({
      where: { userId, status: 'ACTIVE' },
    });

    const plan = await this.prisma.userPlan.create({
      data: {
        userId,
        title: dto.title,
        type: dto.type,
        source: dto.source ?? 'COACH',
        workoutPlanId: dto.workoutPlanId,
        dietPlanId: dto.dietPlanId,
        requestId: dto.requestId,
        status: 'DRAFT',
        customizedAt: new Date(),
      },
    });

    if (active > 0) {
      // هشدار: کاربر یک برنامه ACTIVE دارد
      return { plan, warning: 'شما یک برنامه فعال دارید — این برنامه DRAFT است' };
    }
    return { plan };
  }

  async updatePlan(userId: string, id: string, dto: UpdateUserPlanDto) {
    await this.checkOwner(userId, id);
    return this.prisma.userPlan.update({ where: { id }, data: dto });
  }

  async activatePlan(userId: string, id: string) {
    await this.checkOwner(userId, id);

    // غیرفعال کردن برنامه‌های ACTIVE قبلی (اتمیک)
    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.userPlan.findFirst({ where: { id, userId }, select: { status: true } });
      if (!plan) throw new NotFoundException('برنامه یافت نشد');
      if (plan.status === 'ACTIVE') throw new ConflictException('این برنامه قبلاً فعال است');

      await tx.userPlan.updateMany({
        where: { userId, status: 'ACTIVE' },
        data: { status: 'COMPLETED' },
      });

      return tx.userPlan.update({
        where: { id },
        data: { status: 'ACTIVE', activatedAt: new Date() },
      });
    });
  }

  async completePlan(userId: string, id: string) {
    await this.checkOwner(userId, id);
    return this.prisma.userPlan.update({ where: { id }, data: { status: 'COMPLETED' } });
  }

  async customizePlan(userId: string, id: string, dto: CustomizeSnapshotDto) {
    await this.checkOwner(userId, id);
    return this.prisma.userPlan.update({
      where: { id },
      data: {
        snapshotExercise: dto.snapshotExercise ?? undefined,
        snapshotDiet: dto.snapshotDiet ?? undefined,
        customizedAt: new Date(),
      },
    });
  }

  async deletePlan(userId: string, id: string) {
    await this.checkOwner(userId, id);
    await this.prisma.userPlan.delete({ where: { id } });
    return { success: true };
  }

  // ================= Helpers =================

  private async checkOwner(userId: string, planId: string) {
    const plan = await this.prisma.userPlan.findFirst({
      where: { id: planId, userId },
      select: { id: true },
    });
    if (!plan) throw new ForbiddenException('برنامه یافت نشد یا متعلق به شما نیست');
  }

  private planSummarySelect() {
    return {
      id: true, title: true, type: true, status: true, source: true,
      startDate: true, endDate: true, createdAt: true,
      workoutPlan: { select: { id: true, title: true } },
      dietPlan: { select: { id: true, title: true } },
    };
  }
}