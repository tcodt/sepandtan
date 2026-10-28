/**
 * DiscountsService - سرویس مدیریت کدهای تخفیف
 */
import { Injectable, NotFoundException, BadRequestException, Body, ConflictException } from '@nestjs/common';
import { CreateDiscountDto, SearchDiscountDto } from './dto/discount.dto.js';
import { ValidateDiscountDto } from './dto/validate.discount.dto.js';
import { ConfigService } from '@nestjs/config';
import { DiscountType, Prisma, StatusDiscount } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { DiscountQueueService } from '../queues/discount/discount-queue.service.js';
import pagination from '../../common/utils/pagination.js';

type Decimal = Prisma.Decimal;
@Injectable()
export class DiscountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly discountQueueService: DiscountQueueService,
    private readonly configService: ConfigService,
  ) { }

  /** دریافت تمام کدهای تخفیف */
  async findAll(query: SearchDiscountDto) {
    const { code, status, type, isActive, limit, order, page = 1, userId } = query
    const where: Prisma.DiscountCodeWhereInput = {
      ...(code && { code: { contains: code, mode: 'insensitive' } }),
      ...(status && status !== 'ALL' && { status }),
      ...(isActive && { isActive }),
      ...(userId && { userId }),
      ...((type === 'FIXED' || type === 'PERCENTAGE') && { type }),
    }
    const limitPage = Number(limit) || Number(this.configService.get('limit.discounts'))
    const skip = (Number(page) - 1) * Number(limitPage);
    const [discounts, total] = await Promise.all([
      this.prisma.discountCode.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              id: true,
              store: {
                select: {
                  slug: true,
                  name: true,
                }
              }
            }
          }
        },
        take: limitPage, orderBy: { createdAt: order || 'asc' }, skip
      }),
      this.prisma.discountCode.count({ where }),
    ]);
    const pages = pagination(total, page, limitPage)
    return { discounts, pagination: pages };
  }

  async listDiscount() {
    const discounts = await this.prisma.discountCode.findMany({
      where: {
        status: 'PRODUCT'
      },
      select: {
        id: true,
        code: true,
        isActive: true,
      }
    })
    return discounts
  }

  /** ایجاد کد تخفیف جدید */
  async create(userId: string, dto: CreateDiscountDto) {
    const { storeId, ...body } = dto
    if (dto.status === 'STORE' && !storeId?.length) {
      throw new BadRequestException('آیدی های فروشنده ها را همراه با کد تخفیف ارسال کنید');
    }
    const existing = await this.prisma.discountCode.findUnique({ where: { code: dto.code.toUpperCase() } });
    if (existing) throw new ConflictException('این کد تخفیف قبلاً ثبت شده است');
    const now = new Date();
    const storeIdArry = dto.storeId || []
    const discount = await this.prisma.discountCode.create({
      data: {
        ...body,
        code: dto.code.toUpperCase(),
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        userId
      },
    });
    if (storeIdArry.length && body.status === 'STORE') {
      const map = storeIdArry.map((item) => {
        return {
          discountCodeId: discount.id,
          storeId: item
        }
      })
      await this.prisma.discountCodeStore.createMany({
        data: map
      })
    }
    if (discount.endsAt) {
      await this.discountQueueService.scheduleExpire(discount.id, discount.endsAt);
    }
    if (discount.startsAt > now) {
      await this.discountQueueService.scheduleActivate(discount.id, discount.startsAt);
    }
    return { success: true }
  }

  async update(discountId: string, dto: CreateDiscountDto) {
    const existingDiscount = await this.prisma.discountCode.findUnique({
      where: { id: discountId }
    });
    if (!existingDiscount) {
      throw new NotFoundException(`کد تخفیف با شناسه ${discountId} یافت نشد`);
    }
    const { storeId, status, ...body } = dto
    const now = new Date();
    const storeIdArry = dto.storeId || []
    const discount = await this.prisma.discountCode.update({
      data: {
        ...body,
        code: dto.code.toUpperCase(),
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
      },
      where: {
        id: discountId
      }
    });
    if (status === 'STORE') {
      await this.prisma.discountCodeStore.deleteMany({
        where: { discountCodeId: discount.id }
      });
      const map = storeIdArry.map((item) => {
        return {
          discountCodeId: discount.id,
          storeId: item
        }
      })
      await this.prisma.discountCodeStore.createMany({
        data: map
      })
    }
    if (existingDiscount.status === 'PRODUCT') {
      await this.discountQueueService.enqueueImmediateSync(discountId);
    }
    await this.discountQueueService.cancelJobs(discountId);
    if (discount.endsAt) {
      await this.discountQueueService.scheduleExpire(discount.id, discount.endsAt);
    }
    if (discount.startsAt > now) {
      await this.discountQueueService.scheduleActivate(discount.id, discount.startsAt);
    }
    return { success: true }
  }

  /** حذف کد تخفیف */
  async delete(id: string) {
    const discount = await this.prisma.discountCode.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('کد تخفیف یافت نشد');
    if (discount.status === 'PRODUCT') {
      const variants = await this.prisma.productVariant.findMany({
        where: { discountId: id },
        select: { productId: true },
        distinct: ['productId'],
      });
      const productIds = variants.map((v) => v.productId);
      await this.discountQueueService.cancelJobs(id);
      await this.prisma.discountCode.delete({ where: { id } });
      await this.discountQueueService.enqueueSyncForProducts(productIds);
      return { success: true }
    } else {
      await this.discountQueueService.cancelJobs(id);
      await this.prisma.discountCode.delete({ where: { id } });
      return { success: true }
    }
  }

  /** فعال/غیرفعال کردن کد تخفیف */
  async toggleActive(id: string) {
    const discount = await this.prisma.discountCode.findUnique({ where: { id } });
    if (!discount) throw new NotFoundException('کد تخفیف یافت نشد');
    await this.prisma.discountCode.update({ where: { id }, data: { isActive: !discount.isActive } });
    if (discount.status === 'PRODUCT') {
      await this.discountQueueService.enqueueImmediateSync(id);
    }
    return { success: true }
  }

  async validate(body: ValidateDiscountDto, userId: string) {
    const code = body.code?.trim().toUpperCase();
    const stores = body.stores || [];
    if (!code) throw new BadRequestException('کد تخفیف را وارد کنید');
    if (!stores.length) throw new BadRequestException('سبد خرید خالی است');

    const discount = await this.prisma.discountCode.findUnique({
      where: { code },
      select: {
        id: true, code: true, type: true, status: true, value: true,
        minOrderAmount: true, maxDiscount: true, usageLimit: true, usedCount: true,
        perUserLimit: true, startsAt: true, endsAt: true, isActive: true,
        discountCodeStores: { select: { storeId: true } },
      },
    });
    if (!discount) throw new BadRequestException('کد تخفیف یافت نشد');
    if (discount.status === StatusDiscount.PRODUCT) throw new BadRequestException('تخفیف محصول کد تخفیف ندارد و باید از خود Variant اعمال شود');

    const now = Date.now();
    if (!discount.isActive) throw new BadRequestException('کد تخفیف غیرفعال است');
    if (now < discount.startsAt.getTime()) throw new BadRequestException('کد تخفیف هنوز فعال نشده است');
    if (now > discount.endsAt.getTime()) throw new BadRequestException('کد تخفیف منقضی شده است');
    if (discount.usageLimit > 0 && discount.usedCount >= discount.usageLimit) throw new BadRequestException('ظرفیت استفاده از این کد تخفیف تکمیل شده است');
    if (discount.perUserLimit > 0) {
      const used = await this.prisma.discountCodeUsage.count({ where: { discountCodeId: discount.id, userId } });
      if (used >= discount.perUserLimit) throw new BadRequestException('شما بیش از حد مجاز از این کد تخفیف استفاده کرده‌اید');
    }

    const D = (v: any) => new Prisma.Decimal(v || 0);
    const R = (v: Decimal) => v.toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
    const isPercent = (t: any) => String(t).toLowerCase() === 'percentage';
    const cap = (base: Decimal, type: any, value: Decimal, max: Decimal | null) => {
      if (base.lte(0)) return D(0);
      let amount = isPercent(type) ? base.mul(value).div(100) : value;
      if (max?.gt(0)) amount = Prisma.Decimal.min(amount, max);
      return Prisma.Decimal.min(Prisma.Decimal.max(amount, D(0)), base).toDecimalPlaces(0, Prisma.Decimal.ROUND_FLOOR);
    };
    const allocate = (total: Decimal, bases: Decimal[]) => {
      if (!bases.length || total.lte(0)) return bases.map(() => D(0));
      const sum = bases.reduce((s, b) => s.add(b), D(0));
      if (sum.lte(0)) return bases.map(() => D(0));
      let remain = total;
      return bases.map((b, i) => {
        const share = i === bases.length - 1 ? remain : Prisma.Decimal.min(remain, b, total.mul(b).div(sum).toDecimalPlaces(0, Prisma.Decimal.ROUND_FLOOR));
        remain = remain.sub(share);
        return Prisma.Decimal.max(share, D(0));
      });
    };

    const prepared = stores.map(store => {
      const carts = (store.carts || []).map(cart => ({ cart, price: D(cart.totalPrice), productDiscount: D(cart.totalDiscount) }));
      return {
        store,
        subtotal: carts.reduce((s, c) => s.add(c.price), D(0)),
        commissionRate: D(store.commissionRate ?? store.carts?.[0]?.product?.store?.commissionRate),
        taxRate: D((store as any).taxRate ?? 10),
        carts,
      };
    });
    const subtotal = prepared.reduce((s, x) => s.add(x.subtotal), D(0));
    const minOrder = D(discount.minOrderAmount);
    const maxDiscount = discount.maxDiscount == null ? null : D(discount.maxDiscount);
    const value = D(discount.value);
    const isCommission = discount.status === StatusDiscount.COMMISSION;

    const cartsOf = (p: typeof prepared[number], coupon: Decimal) => {
      const shares = coupon.gt(0) ? allocate(coupon, p.carts.map(c => c.price)) : p.carts.map(() => D(0));
      return p.carts.map((c, i) => ({
        ...c.cart,
        discountAmount: c.productDiscount.add(shares[i]),
        totalAfterDiscount: c.price.sub(shares[i]),
      }));
    };
    const storeOf = (p: typeof prepared[number], coupon: Decimal, takeFromPrice: boolean) => ({
      storeId: p.store.storeId,
      storeName: p.store.storeName,
      storeSlug: p.store.storeSlug,
      subtotal: R(p.subtotal),
      discountAmount: R(coupon),
      totalAfterDiscount: R(takeFromPrice ? Prisma.Decimal.max(D(0), p.subtotal.sub(coupon)) : p.subtotal),
      carts: cartsOf(p, takeFromPrice ? coupon : D(0)),
    });
    const result = (eligible: boolean, amount: Decimal, list: ReturnType<typeof storeOf>[]) => ({
      eligible,
      discountId: discount.id,
      code: discount.code,
      type: discount.type,
      status: discount.status,
      subtotal: R(subtotal),
      discountAmount: R(amount),
      totalAfterDiscount: R(eligible ? Prisma.Decimal.max(D(0), subtotal.sub(amount)) : subtotal),
      minOrderAmount: R(minOrder),
      maxDiscount,
      stores: list,
    });
    const untouched = () => prepared.map(p => storeOf(p, D(0), false));

    if (discount.status === StatusDiscount.PLATFORM) {
      if (subtotal.lt(minOrder)) return result(false, D(0), untouched());
      const amount = cap(subtotal, discount.type, value, maxDiscount);
      const shares = allocate(amount, prepared.map(p => p.subtotal));
      return result(true, amount, prepared.map((p, i) => storeOf(p, shares[i], true)));
    }

    if (discount.status === StatusDiscount.STORE) {
      const allowed = new Set(discount.discountCodeStores.map(x => x.storeId));
      if (!prepared.some(p => allowed.has(p.store.storeId))) throw new BadRequestException('این کد تخفیف شامل فروشگاه‌های سبد خرید شما نمی‌شود');
      const shares = prepared.map(p => (!allowed.has(p.store.storeId) || p.subtotal.lt(minOrder)) ? D(0) : cap(p.subtotal, discount.type, value, maxDiscount));
      const amount = shares.reduce((s, x) => s.add(x), D(0));
      if (amount.lte(0)) return result(false, D(0), untouched());
      return result(true, amount, prepared.map((p, i) => storeOf(p, shares[i], true)));
    }

    if (isCommission) {
      if (discount.type !== DiscountType.PERCENTAGE) throw new BadRequestException('تخفیف کمیسیون فقط باید درصدی باشد');
      const shares = prepared.map(p => {
        if (p.subtotal.lt(minOrder)) return D(0);
        const base = p.subtotal.sub(p.subtotal.mul(p.taxRate).div(100));
        let raw = base.mul(Prisma.Decimal.min(p.commissionRate, value)).div(100);
        if (maxDiscount?.gt(0)) raw = Prisma.Decimal.min(raw, maxDiscount);
        return Prisma.Decimal.max(R(raw), D(0));
      });
      const amount = shares.reduce((s, x) => s.add(x), D(0));
      if (amount.lte(0)) return result(false, D(0), untouched());
      return result(true, amount, prepared.map((p, i) => storeOf(p, shares[i], true)));
    }

    throw new BadRequestException('نوع تخفیف نامعتبر است');
  }
}