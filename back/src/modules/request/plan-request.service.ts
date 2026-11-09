import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
  HttpException, HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import { PlanRequestStatus } from '../../generated/prisma/enums.js';
import {
  CreatePlanRequestDto, PlanRequestAdminDto, PlanRequestQueryAdminDto, PlanRequestQueryDto,
} from './dto/plan-request.dto.js';
import { Num, toNum, tehranToday, tehranDayStart } from './util/plan-snapshot.util.js';

// ───────── قوانین ─────────
/** سقف درخواست در هر روز (به وقت تهران). لغوشده‌ها هم حساب می‌شوند */
const MAX_REQUESTS_PER_DAY = 5;
/** سقف درخواست‌های هم‌زمان باز (PENDING + ACCEPTED) */
const MAX_OPEN_REQUESTS = 5;
/** مهلت پرداخت بعد از تایید مربی */
export const ACCEPT_TTL_MS = 48 * 60 * 60 * 1000;

const OPEN_STATUSES: PlanRequestStatus[] = ['PENDING', 'ACCEPTED'];
const TRACKED_STATUSES: PlanRequestStatus[] = ['PENDING', 'ACCEPTED', 'PAID'];

type ActivePlanLite = { type: string; coachId: string | null; endDate: Date | null };
type PaidLite = { workoutTemplateId: string | null; dietTemplateId: string | null };

@Injectable()
export class PlanRequestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  // ───────── Helpers ─────────

  private getLimit(limit?: number) {
    return Math.max(1, Number(limit) || Number(this.configService.get('limit.coach')) || 10);
  }

  private requestSelect() {
    return {
      id: true,
      status: true,
      note: true,
      images: true,
      price: true,
      originalPrice: true,
      discountAmount: true,
      rejectionReason: true,
      respondedAt: true,
      createdAt: true,
      coach: { select: { id: true, title: true, slug: true } },
      workoutTemplate: { select: { id: true, title: true } },
      dietTemplate: { select: { id: true, title: true } },
    } as const;
  }

  /** Decimal → number و محاسبه‌ی مهلت پرداخت */
  private serialize<
    T extends {
      price: Num | null;
      originalPrice: Num | null;
      discountAmount: Num | null;
      status: string;
      respondedAt: Date | null;
    },
  >(r: T) {
    return {
      ...r,
      price: r.price == null ? null : toNum(r.price),
      originalPrice: r.originalPrice == null ? null : toNum(r.originalPrice),
      discountAmount: r.discountAmount == null ? null : toNum(r.discountAmount),
      payableUntil:
        r.status === 'ACCEPTED' && r.respondedAt
          ? new Date(r.respondedAt.getTime() + ACCEPT_TTL_MS)
          : null,
    };
  }

  private effectivePrice(
    p: { price: Num; discountPrice: Num | null; discountExpired: Date | null },
    now: number,
  ) {
    const base = toNum(p.price);
    const disc = p.discountPrice == null ? null : toNum(p.discountPrice);
    const valid =
      disc != null && disc < base && (p.discountExpired == null || p.discountExpired.getTime() > now);
    return { base, final: valid ? (disc as number) : base };
  }

  /**
   * قوانین «یک برنامه‌ی ورزشی + یک برنامه‌ی غذایی» و «غذایی بدون ورزشی ممکن نیست».
   * هم موقع ثبت درخواست و هم قبل از پرداخت صدا زده می‌شود.
   */
  private assertEligible(p: {
    wantsWorkout: boolean;
    wantsDiet: boolean;
    coachId: string;
    active: ActivePlanLite | null;
    paid: PaidLite[];
  }) {
    const today = tehranToday();
    // برنامه‌ی ACTIVE که تاریخ پایانش گذشته (cron هنوز نبسته) مانع نیست
    const active =
      p.active && (p.active.endDate == null || p.active.endDate >= today) ? p.active : null;

    const hasWorkout = !!active && (active.type === 'WORKOUT' || active.type === 'ALL');
    const hasDiet = !!active && (active.type === 'DIET' || active.type === 'ALL');
    const paidWorkout = p.paid.some((r) => r.workoutTemplateId);
    const paidDiet = p.paid.some((r) => r.dietTemplateId);

    if (p.wantsWorkout && (hasWorkout || paidWorkout)) {
      throw new ConflictException(
        'برنامه‌ی ورزشی فعال دارید (یا پرداخت کرده‌اید و در انتظار تحویل مربی هستید)',
      );
    }
    if (p.wantsDiet && (hasDiet || paidDiet)) {
      throw new ConflictException(
        'برنامه‌ی غذایی فعال دارید (یا پرداخت کرده‌اید و در انتظار تحویل مربی هستید)',
      );
    }

    if (!p.wantsWorkout) {
      if (!active || !hasWorkout) {
        throw new BadRequestException(
          'برنامه‌ی غذایی بدون برنامه‌ی ورزشی ممکن نیست؛ ابتدا برنامه‌ی ورزشی بگیرید یا هر دو را با هم درخواست دهید',
        );
      }
      if (active.coachId && active.coachId !== p.coachId) {
        throw new BadRequestException(
          'برنامه‌ی غذایی را باید از همان مربی‌ی برنامه‌ی ورزشی‌تان انتخاب کنید',
        );
      }
    }
  }

  // ───────── User ─────────

  async create(userId: string, dto: CreatePlanRequestDto) {
    const { workoutTemplateId, dietTemplateId } = dto;
    if (!workoutTemplateId && !dietTemplateId) {
      throw new BadRequestException('حداقل یکی از برنامه‌ی ورزشی یا غذایی را انتخاب کنید');
    }

    const dayStart = tehranDayStart();
    const requestable = {
      isPublished: true,
      coach: { status: 'APPROVED' as const, isAcceptingClients: true },
    };
    const priceSelect = {
      id: true, coachId: true, price: true, discountPrice: true, discountExpired: true,
    } as const;

    // ۴ خواندن هم‌زمان؛ یک خواندن برای همه‌ی قوانین (سقف روزانه، سقف باز، تکراری، پرداخت‌شده)
    const [workout, diet, rows, active] = await Promise.all([
      workoutTemplateId
        ? this.prisma.workoutPlan.findFirst({
          where: { id: workoutTemplateId, ...requestable },
          select: priceSelect,
        })
        : Promise.resolve(null),
      dietTemplateId
        ? this.prisma.dietPlan.findFirst({
          where: { id: dietTemplateId, ...requestable },
          select: priceSelect,
        })
        : Promise.resolve(null),
      this.prisma.planRequest.findMany({
        where: {
          userId,
          OR: [{ createdAt: { gte: dayStart } }, { status: { in: TRACKED_STATUSES } }],
        },
        select: { status: true, createdAt: true, workoutTemplateId: true, dietTemplateId: true },
      }),
      this.prisma.userPlan.findFirst({
        where: { userId, status: 'ACTIVE' },
        select: { type: true, coachId: true, endDate: true },
      }),
    ]);

    if (workoutTemplateId && !workout) {
      throw new NotFoundException('برنامه‌ی ورزشی یافت نشد یا مربی در حال حاضر درخواست نمی‌پذیرد');
    }
    if (dietTemplateId && !diet) {
      throw new NotFoundException('برنامه‌ی غذایی یافت نشد یا مربی در حال حاضر درخواست نمی‌پذیرد');
    }
    const coachId = (workout ?? diet)?.coachId;
    if (!coachId) throw new NotFoundException('مربی برنامه یافت نشد');
    if (workout && diet && workout.coachId !== diet.coachId) {
      throw new BadRequestException('برنامه‌ی غذایی باید از همان مربی‌ی برنامه‌ی ورزشی باشد');
    }

    this.assertEligible({
      wantsWorkout: !!workoutTemplateId,
      wantsDiet: !!dietTemplateId,
      coachId,
      active,
      paid: rows.filter((r) => r.status === 'PAID'),
    });

    const open = rows.filter((r) => r.status === 'PENDING' || r.status === 'ACCEPTED');
    if (
      open.some(
        (r) =>
          r.workoutTemplateId === (workoutTemplateId ?? null) &&
          r.dietTemplateId === (dietTemplateId ?? null),
      )
    ) {
      throw new ConflictException('برای همین برنامه قبلاً درخواست فعال دارید');
    }
    if (rows.filter((r) => r.createdAt >= dayStart).length >= MAX_REQUESTS_PER_DAY) {
      throw new HttpException(
        `حداکثر ${MAX_REQUESTS_PER_DAY} درخواست در روز مجاز است (درخواست‌های لغوشده هم حساب می‌شوند)`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    if (open.length >= MAX_OPEN_REQUESTS) {
      throw new HttpException(
        `حداکثر ${MAX_OPEN_REQUESTS} درخواست باز هم‌زمان مجاز است؛ ابتدا چند درخواست را لغو کنید`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // قیمت در لحظه‌ی ثبت ثابت می‌شود (تغییر بعدی قیمت قالب روی این درخواست اثر ندارد)
    const now = Date.now();
    const w = workout ? this.effectivePrice(workout, now) : { base: 0, final: 0 };
    const d = diet ? this.effectivePrice(diet, now) : { base: 0, final: 0 };
    const originalPrice = w.base + d.base;
    const price = w.final + d.final;

    const created = await this.prisma.planRequest.create({
      data: {
        userId,
        coachId,
        workoutTemplateId,
        dietTemplateId,
        images: dto.images ?? [],
        note: dto.note,
        originalPrice,
        price,
        discountAmount: originalPrice - price,
      },
      select: this.requestSelect(),
    });
    return this.serialize(created);
  }

  async getMyRequests(userId: string, query: PlanRequestQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = { userId, ...(query.status ? { status: query.status } : {}) };

    const [data, count] = await Promise.all([
      this.prisma.planRequest.findMany({
        where, skip, take: limitPage,
        orderBy: { createdAt: 'desc' },
        select: this.requestSelect(),
      }),
      this.prisma.planRequest.count({ where }),
    ]);
    return {
      requests: data.map((r) => this.serialize(r)),
      pagination: pagination(count, page, limitPage),
    };
  }

  async cancel(userId: string, id: string) {
    // مسیر موفق: یک کوئری
    const { count } = await this.prisma.planRequest.updateMany({
      where: { id, userId, status: { in: OPEN_STATUSES } },
      data: { status: 'CANCELLED' },
    });
    if (count) return { id, status: 'CANCELLED' as const };

    const r = await this.prisma.planRequest.findFirst({
      where: { id, userId },
      select: { status: true },
    });
    if (!r) throw new NotFoundException('درخواست یافت نشد');
    if (r.status === 'PAID' || r.status === 'DELIVERED') {
      throw new ConflictException('پس از پرداخت امکان لغو نیست؛ با پشتیبانی تماس بگیرید');
    }
    throw new ConflictException(`درخواست در وضعیت ${r.status} قابل لغو نیست`);
  }

  async deleteMyRequests(userId: string, id: string) {
    const { count } = await this.prisma.planRequest.deleteMany({
      where: { id, userId, status: { in: ['PENDING', 'CANCELLED', 'ACCEPTED', 'REJECTED'] } }
    });
    if (count) return { id, status: 'Deleted' as const };

    const r = await this.prisma.planRequest.findFirst({
      where: { id, userId },
      select: { status: true },
    });
    if (!r) throw new NotFoundException('درخواست یافت نشد');
    if (r.status === 'PAID' || r.status === 'DELIVERED') {
      throw new ConflictException('پس از پرداخت امکان حذف نیست؛ با پشتیبانی تماس بگیرید');
    }
    throw new ConflictException(`درخواست در وضعیت ${r.status} قابل حذف نیست`);
  }

  // ───────── Coach ─────────

  async getCoachRequests(coachUserId: string, query: PlanRequestQueryDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limitPage = this.getLimit(query.limit);
    const skip = (page - 1) * limitPage;
    const where = { coach: { userId: coachUserId }, ...(query.status ? { status: query.status } : {}) };

    const [data, count] = await Promise.all([
      this.prisma.planRequest.findMany({
        where, skip, take: limitPage,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          note: true,
          images: true,
          price: true,
          originalPrice: true,
          discountAmount: true,
          rejectionReason: true,
          respondedAt: true,
          createdAt: true,
          workoutTemplate: { select: { id: true, title: true } },
          dietTemplate: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.planRequest.count({ where }),
    ]);
    return {
      requests: data.map((r) => this.serialize(r)),
      pagination: pagination(count, page, limitPage),
    };
  }

  /** جزئیات برای تصمیم مربی: همراه با پروفایل کاربر (آسیب، بیماری، حساسیت، سطح و ...) */
  async getCoachRequest(coachUserId: string, id: string) {
    const r = await this.prisma.planRequest.findFirst({
      where: { id, coach: { userId: coachUserId } },
      select: {
        id: true,
        status: true,
        note: true,
        images: true,
        price: true,
        originalPrice: true,
        discountAmount: true,
        rejectionReason: true,
        respondedAt: true,
        createdAt: true,
        workoutTemplate: { select: { id: true, title: true } },
        dietTemplate: { select: { id: true, title: true } },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            profile: {
              select: {
                heightCm: true,
                currentWeightKg: true,
                targetWeightKg: true,
                age: true,
                gender: true,
                activityLevel: true,
                experienceLevel: true,
                trainingLocation: true,
                trainingDaysPerWeek: true,
                injuries: true,
                medicalConditions: true,
                allergies: true,
                dietaryRestrictions: true,
                trainingGoal: { select: { title: true } },
                equipment: { select: { title: true } }
              },
            },
          },
        },
      },
    });
    if (!r) throw new NotFoundException('درخواست یافت نشد');

    const { user, ...rest } = r;
    const p = user.profile;
    return {
      ...this.serialize(rest),
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        profile: p && {
          ...p,
          heightCm: p.heightCm == null ? null : toNum(p.heightCm),
          currentWeightKg: p.currentWeightKg == null ? null : toNum(p.currentWeightKg),
          targetWeightKg: p.targetWeightKg == null ? null : toNum(p.targetWeightKg),
        },
      },
    };
  }

  async accept(coachUserId: string, id: string) {
    const req = await this.prisma.planRequest.findFirst({
      where: { id, coach: { userId: coachUserId } },
      select: {
        id: true,
        status: true,
        price: true,
        coachId: true,
        workoutTemplateId: true,
        coach: { select: { status: true, isAcceptingClients: true, maxClients: true } },
      },
    });
    if (!req) throw new NotFoundException('درخواست یافت نشد');
    if (req.status !== 'PENDING') {
      throw new ConflictException(`درخواست در وضعیت ${req.status} قابل تایید نیست`);
    }
    if (req.coach.status !== 'APPROVED') {
      throw new BadRequestException('حساب مربی هنوز توسط ادمین تایید نشده است');
    }

    // ظرفیت: فقط برای مشتری‌ی جدید (درخواست دارای برنامه‌ی ورزشی). غذایی‌ِ مشتری‌ی فعلی ظرفیت نمی‌گیرد
    if (req.workoutTemplateId) {
      if (!req.coach.isAcceptingClients) {
        throw new BadRequestException('پذیرش مشتری‌ی جدید در پروفایل شما غیرفعال است');
      }
      const ttlStart = new Date(Date.now() - ACCEPT_TTL_MS);
      const [activePlans, inFlight] = await Promise.all([
        this.prisma.userPlan.count({ where: { coachId: req.coachId, status: 'ACTIVE' } }),
        this.prisma.planRequest.count({
          where: {
            coachId: req.coachId,
            workoutTemplateId: { not: null },
            OR: [{ status: 'PAID' }, { status: 'ACCEPTED', respondedAt: { gte: ttlStart } }],
          },
        }),
      ]);
      if (activePlans + inFlight >= req.coach.maxClients) {
        throw new ConflictException('ظرفیت شاگردان شما تکمیل است');
      }
    }

    const respondedAt = new Date();
    const { count } = await this.prisma.planRequest.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'ACCEPTED', respondedAt },
    });
    if (!count) throw new ConflictException('درخواست هم‌اکنون توسط کاربر یا شما تغییر کرد');

    const amount = req.price == null ? 0 : toNum(req.price);
    if (amount <= 0) {
      // برنامه‌ی رایگان: مرحله‌ی پرداخت ندارد
      await this.confirmPayment(id);
      return { id, status: 'PAID' as const, payableAmount: 0, payableUntil: null };
    }
    return {
      id,
      status: 'ACCEPTED' as const,
      payableAmount: amount,
      payableUntil: new Date(respondedAt.getTime() + ACCEPT_TTL_MS),
    };
  }

  async reject(coachUserId: string, id: string, reason: string) {
    const { count } = await this.prisma.planRequest.updateMany({
      where: { id, status: 'PENDING', coach: { userId: coachUserId } },
      data: { status: 'REJECTED', rejectionReason: reason, respondedAt: new Date() },
    });
    if (count) return { id, status: 'REJECTED' as const };

    const r = await this.prisma.planRequest.findFirst({
      where: { id, coach: { userId: coachUserId } },
      select: { status: true },
    });
    if (!r) throw new NotFoundException('درخواست یافت نشد');
    throw new ConflictException(`درخواست در وضعیت ${r.status} قابل رد نیست`);
  }
  // ───────── Admin ─────────
  async deleteAdminRequests(id: string) {
    const { count } = await this.prisma.planRequest.deleteMany({
      where: { id, status: { in: ['PENDING', 'CANCELLED', 'ACCEPTED', 'REJECTED'] } }
    });
    if (count) return { id, status: 'Deleted' as const };
    const r = await this.prisma.planRequest.findUnique({
      where: { id },
      select: { status: true },
    });
    if (!r) throw new NotFoundException('درخواست یافت نشد');
    if (r.status === 'PAID' || r.status === 'DELIVERED') {
      throw new ConflictException('پس از پرداخت امکان حذف نیست؛ باید وضعیت درخواست رو تغییر بدین');
    }
    throw new ConflictException(`درخواست در وضعیت ${r.status} قابل حذف نیست`);
  }
  
  async updateAdmin(id: string, body: PlanRequestAdminDto) {
    const req = await this.prisma.planRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        price: true,
        coachId: true,
        workoutTemplateId: true,
        coach: { select: { status: true, isAcceptingClients: true, maxClients: true } },
      },
    });
    if (!req) throw new NotFoundException('درخواست یافت نشد');
    if (req.coach.status !== 'APPROVED') {
      throw new BadRequestException('حساب مربی هنوز توسط ادمین تایید نشده است');
    }
    const respondedAt = new Date();
    if (req.workoutTemplateId && (body.status === 'ACCEPTED' || body.status === 'PAID')) {
      if (!req.coach.isAcceptingClients) {
        throw new BadRequestException('پذیرش مشتری‌ی جدید در پروفایل شما غیرفعال است');
      }
      const ttlStart = new Date(Date.now() - ACCEPT_TTL_MS);
      const [activePlans, inFlight] = await Promise.all([
        this.prisma.userPlan.count({ where: { coachId: req.coachId, status: 'ACTIVE' } }),
        this.prisma.planRequest.count({
          where: {
            coachId: req.coachId,
            workoutTemplateId: { not: null },
            OR: [{ status: 'PAID' }, { status: 'ACCEPTED', respondedAt: { gte: ttlStart } }],
          },
        }),
      ]);
      if (activePlans + inFlight >= req.coach.maxClients) {
        throw new ConflictException('ظرفیت شاگردان شما تکمیل است');
      }
    }
    if (body.status === 'PAID') {
      await this.confirmPayment(id)
    }
    return this.prisma.planRequest.update({
      where: { id },
      data: { ...body, respondedAt }
    })
  }

  async getAllRequestAdmin(query: PlanRequestQueryAdminDto) {
    const { coachId, limit, order, page = 1, status } = query
    const limitPage = this.getLimit(limit);
    const skip = (page - 1) * limitPage;
    const where = {
      ...(status && status !== undefined && { status }),
      ...(coachId && coachId !== undefined && { coachId })
    };

    const [data, count] = await Promise.all([
      this.prisma.planRequest.findMany({
        where, skip, take: limitPage,
        orderBy: { createdAt: order || 'desc' },
        select: {
          id: true,
          status: true,
          note: true,
          images: true,
          price: true,
          originalPrice: true,
          discountAmount: true,
          rejectionReason: true,
          respondedAt: true,
          createdAt: true,
          workoutTemplate: { select: { id: true, title: true } },
          dietTemplate: { select: { id: true, title: true } },
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.planRequest.count({ where }),
    ]);
    return {
      requests: data.map((r) => this.serialize(r)),
      pagination: pagination(count, page, limitPage),
    };
  }

  async getSingleRequestAdmin(id: string) {
    const r = await this.prisma.planRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        note: true,
        images: true,
        price: true,
        originalPrice: true,
        discountAmount: true,
        rejectionReason: true,
        respondedAt: true,
        createdAt: true,
        workoutTemplate: { select: { id: true, title: true } },
        dietTemplate: { select: { id: true, title: true } },
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            profile: {
              select: {
                heightCm: true,
                currentWeightKg: true,
                targetWeightKg: true,
                age: true,
                gender: true,
                activityLevel: true,
                experienceLevel: true,
                trainingLocation: true,
                trainingDaysPerWeek: true,
                injuries: true,
                medicalConditions: true,
                allergies: true,
                dietaryRestrictions: true,
                trainingGoal: { select: { title: true } },
                equipment: { select: { title: true } }
              },
            },
          },
        },
      },
    });
    if (!r) throw new NotFoundException('درخواست یافت نشد');

    const { user, ...rest } = r;
    const p = user.profile;
    return {
      ...this.serialize(rest),
      user: {
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        profile: p && {
          ...p,
          heightCm: p.heightCm == null ? null : toNum(p.heightCm),
          currentWeightKg: p.currentWeightKg == null ? null : toNum(p.currentWeightKg),
          targetWeightKg: p.targetWeightKg == null ? null : toNum(p.targetWeightKg),
        },
      },
    };
  }
  // ───────── Payment hooks (بدون route؛ از ماژول پرداخت صدا بزن) ─────────

  /**
   * قبل از ساخت لینک/تراکنش پرداخت صدا بزن.
   * وضعیت، مهلت و تداخل با برنامه‌ی فعال را چک می‌کند و مبلغ قابل پرداخت را برمی‌گرداند.
   */
  async assertPayable(userId: string, requestId: string) {
    const req = await this.prisma.planRequest.findFirst({
      where: { id: requestId, userId },
      select: {
        id: true,
        status: true,
        price: true,
        respondedAt: true,
        coachId: true,
        workoutTemplateId: true,
        dietTemplateId: true,
      },
    });
    if (!req) throw new NotFoundException('درخواست یافت نشد');
    if (req.status === 'PAID' || req.status === 'DELIVERED') {
      throw new ConflictException('این درخواست قبلاً پرداخت شده است');
    }
    if (req.status !== 'ACCEPTED') {
      throw new ConflictException('درخواست هنوز توسط مربی تایید نشده یا لغو شده است');
    }
    if (!req.respondedAt || req.respondedAt.getTime() + ACCEPT_TTL_MS < Date.now()) {
      await this.prisma.planRequest.updateMany({
        where: { id: requestId, status: 'ACCEPTED' },
        data: { status: 'CANCELLED' },
      });
      throw new ConflictException('مهلت پرداخت تمام شده است؛ درخواست جدید ثبت کنید');
    }

    const [active, paid] = await Promise.all([
      this.prisma.userPlan.findFirst({
        where: { userId, status: 'ACTIVE' },
        select: { type: true, coachId: true, endDate: true },
      }),
      this.prisma.planRequest.findMany({
        where: { userId, status: 'PAID', id: { not: requestId } },
        select: { workoutTemplateId: true, dietTemplateId: true },
      }),
    ]);
    this.assertEligible({
      wantsWorkout: !!req.workoutTemplateId,
      wantsDiet: !!req.dietTemplateId,
      coachId: req.coachId,
      active,
      paid,
    });

    return {
      id: req.id,
      amount: req.price == null ? 0 : toNum(req.price),
      coachId: req.coachId,
      workoutTemplateId: req.workoutTemplateId,
      dietTemplateId: req.dietTemplateId,
    };
  }

  /**
   * بعد از تایید موفق پرداخت صدا بزن (idempotent).
   * درخواست را PAID می‌کند و درخواست‌های باز دیگر کاربر را که با همین برنامه‌ها هم‌پوشانی دارند لغو می‌کند.
   */
  async confirmPayment(requestId: string) {
    const req = await this.prisma.planRequest.findUnique({
      where: { id: requestId },
      select: { id: true, userId: true, status: true, workoutTemplateId: true, dietTemplateId: true },
    });
    if (!req) throw new NotFoundException('درخواست یافت نشد');
    if (req.status === 'PAID' || req.status === 'DELIVERED') {
      return { id: req.id, status: req.status, alreadyPaid: true };
    }
    if (req.status !== 'ACCEPTED') {
      throw new ConflictException(
        `درخواست در وضعیت ${req.status} است و پرداخت قابل ثبت نیست (در صورت کسر وجه، نیاز به بازگشت وجه دارد)`,
      );
    }

    const overlap = [
      ...(req.workoutTemplateId ? [{ workoutTemplateId: { not: null } }] : []),
      ...(req.dietTemplateId ? [{ dietTemplateId: { not: null } }] : []),
    ];

    const ok = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.planRequest.updateMany({
        where: { id: requestId, status: 'ACCEPTED' },
        data: { status: 'PAID' },
      });
      if (!count) return false;
      await tx.planRequest.updateMany({
        where: {
          userId: req.userId,
          id: { not: requestId },
          status: { in: OPEN_STATUSES },
          OR: overlap,
        },
        data: {
          status: 'CANCELLED',
          rejectionReason: 'لغو خودکار: برنامه‌ی مشابه خریداری شد',
        },
      });
      return true;
    });

    if (!ok) {
      const again = await this.prisma.planRequest.findUnique({
        where: { id: requestId },
        select: { status: true },
      });
      if (again?.status === 'PAID' || again?.status === 'DELIVERED') {
        return { id: req.id, status: again.status, alreadyPaid: true };
      }
      throw new ConflictException('وضعیت درخواست هم‌زمان تغییر کرد');
    }
    return { id: req.id, status: 'PAID' as const, alreadyPaid: false };
  }
}
