import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CreateProductVariantDto, UpdateProductVariantDto } from './dto/ProductVariant.dto.js';
import { AttributeDefinitionDto, AttributeDefinitionSearch } from './dto/AttributeDefinition.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';

@Injectable()
export class VariantsService {
  private readonly logger = new Logger(VariantsService.name);

  constructor(private readonly prisma: PrismaService) { }

  private generateSku(): string {
    const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const part = () =>
      Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('');
    return `${part()}-${part()}-${part()}`;
  }

  async syncProductPricing(productId: string, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;
    const variants = await client.productVariant.findMany({
      where: { productId },
      select: {
        price: true,
        discount: {
          select: {
            id: true,
            isActive: true,
            type: true,
            value: true,
            startsAt: true,
            endsAt: true,
          },
        },
      },
    });
    if (!variants || variants.length === 0) {
      await client.product.update({
        where: { id: productId },
        data: { originalPrice: null, minPrice: null, discountPercent: null },
      });
      return;
    }
    const now = new Date();
    let minEffectivePrice: Prisma.Decimal | null = null;
    let selectedOriginalPrice: Prisma.Decimal | null = null;
    let maxDiscountPercent = 0;

    for (const v of variants) {
      if (v.price === null || v.price === undefined) continue;

      const basePrice = new Prisma.Decimal(v.price);
      let effectivePrice = basePrice;
      let calculatedPercent = 0;

      // بررسی اعتبار زمان و وضعیت تخفیف
      const isDiscountValid =
        v.discount &&
        v.discount.isActive &&
        (!v.discount.startsAt || new Date(v.discount.startsAt) <= now) &&
        (!v.discount.endsAt || new Date(v.discount.endsAt) >= now);

      if (isDiscountValid && v.discount) {
        const discountVal = new Prisma.Decimal(v.discount.value);

        // حالت اول: تخفیف درصدی
        if (v.discount.type === 'PERCENTAGE') {
          calculatedPercent = discountVal.toNumber();
          effectivePrice = basePrice
            .mul(new Prisma.Decimal(100 - calculatedPercent))
            .div(100);
        }
        // حالت دوم: تخفیف مبلغ ثابت (Fixed)
        else if (v.discount.type === 'FIXED') {
          // کسر مبلغ ثابت از قیمت پایه
          effectivePrice = basePrice.minus(discountVal);
          if (effectivePrice.isNegative()) effectivePrice = new Prisma.Decimal(0);

          // 💡 تبدیل مبلغ ثابت به درصد معادل جهت محاسبه بیشترین درصد تخفیف
          if (basePrice.greaterThan(0)) {
            calculatedPercent = discountVal
              .div(basePrice)
              .mul(100)
              .toNumber();
          }
        }
      }

      // گرد کردن قیمت نهایی به ۲ رقم اعشار
      effectivePrice = effectivePrice.toDecimalPlaces(2);
      const roundedPercent = Math.round(calculatedPercent);

      if (roundedPercent > maxDiscountPercent) {
        maxDiscountPercent = roundedPercent;
      }
      if (minEffectivePrice === null || effectivePrice.lessThan(minEffectivePrice)) {
        minEffectivePrice = effectivePrice;
        selectedOriginalPrice = (isDiscountValid && roundedPercent > 0) ? basePrice : effectivePrice;
      }
    }

    await client.product.update({
      where: { id: productId },
      data: {
        minPrice: minEffectivePrice,
        originalPrice: selectedOriginalPrice,
        discountPercent: maxDiscountPercent > 0 ? String(maxDiscountPercent) : null,
      },
    });
  }

  async createVariant(dto: CreateProductVariantDto) {
    return this.prisma.$transaction(async (tx) => {
      const variant = await this.createWithUniqueSkuRetry(tx, dto);
      await this.syncProductPricing(dto.productId, tx);
      return variant;
    });
  }

  private async createWithUniqueSkuRetry(tx: Prisma.TransactionClient, dto: CreateProductVariantDto) {
    const { attributes, ...variantData } = dto;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        return await tx.productVariant.create({
          data: {
            ...variantData, sku: this.generateSku(),
            ...(attributes && attributes.length > 0 && {
              attributes: {
                create: attributes.map((attr) => ({
                  attributeId: attr.attributeId,
                  value: attr.value,
                })),
              },
            }),
          },
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          (error.meta?.target as string[])?.includes('sku')
        ) {
          continue;
        }
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === 'P2003' || error.code === 'P2025')
        ) {
          throw new BadRequestException('محصول، رنگ یا کد تخفیف انتخاب‌شده معتبر نیست');
        }
        throw error;
      }
    }
    throw new BadRequestException('تولید SKU یکتا ناموفق بود، دوباره تلاش کنید');
  }

  async getVariants(productId: string) {
    return this.prisma.productVariant.findMany({
      where: { productId },
      orderBy: { createdAt: 'asc' },
      include: {
        discount: { select: { id: true, code: true, isActive: true, value: true, type: true, startsAt: true, endsAt: true } },
        color: { select: { id: true, hexCode: true, name: true } },
        attributes: {
          select: {
            id: true,
            value: true,
            attributeId: true,
            attribute: { select: { id: true, key: true, label: true } },
          },
        },
      },
    });
  }

  async updateVariant(variantId: string, dto: UpdateProductVariantDto) {
    // جدا کردن attributes از بقیه فیلدها
    const { attributes, ...variantData } = dto;

    return this.prisma.$transaction(async (tx) => {
      let updated;
      try {
        updated = await tx.productVariant.update({
          where: { id: variantId },
          data: {
            ...(variantData.name !== undefined && { name: variantData.name }),
            ...(variantData.price !== undefined && { price: variantData.price }),
            ...(variantData.quantity !== undefined && { quantity: variantData.quantity }),
            ...(variantData.colorId !== undefined && { colorId: variantData.colorId || null }),
            ...(variantData.image !== undefined && { image: variantData.image || null }),
            ...(variantData.discountId !== undefined && { discountId: variantData.discountId || null }),
            ...(attributes !== undefined && {
              attributes: {
                deleteMany: {},
                create: attributes.map((attr) => ({
                  attributeId: attr.attributeId,
                  value: attr.value,
                })),
              },
            }),
          },
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
          throw new NotFoundException('تنوع محصول یافت نشد');
        }
        throw error;
      }
      await this.syncProductPricing(updated.productId, tx);
      return updated;
    });
  }

  async deleteVariant(variantId: string) {
    return this.prisma.$transaction(async (tx) => {
      let variant;
      try {
        // ۱. ابتدا ویژگی‌های مربوط به این تنوع را پاک کنید
        await tx.variantAttributeValue.deleteMany({
          where: { variantId },
        });

        // ۲. سپس خود تنوع را حذف کنید
        variant = await tx.productVariant.delete({
          where: { id: variantId }
        });

      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
          // اگر تنوع اصلاً پیدا نشود
          if (error.code === 'P2025') {
            throw new NotFoundException('تنوع محصول یافت نشد');
          }

          // اگر تنوع در سفارشات مشتریان (order_items) ثبت شده باشد
          if (error.code === 'P2003') {
            throw new BadRequestException(
              'این تنوع قابل حذف نیست زیرا در فاکتورها یا سفارشات قبلی ثبت شده است.'
            );
          }
        }
        throw error;
      }

      // ۳. بهینه‌سازی و به‌روزرسانی قیمت‌های محصول والد
      await this.syncProductPricing(variant.productId, tx);

      return { success: true, message: 'تنوع محصول با موفقیت حذف شد' };
    });
  }
  /** ###############   AttributeDefinition   ################ */

  async getAttributeDefinition(query: AttributeDefinitionSearch) {
    const { categoryId, search, noDetail } = query
    const where: Prisma.AttributeDefinitionWhereInput = {
      ...(categoryId && categoryId.length > 0 && {
        category: {
          some: {
            id: {
              in: categoryId,
            },
          },
        },
      }),
      ...(search && {
        OR: [
          { label: { contains: search, mode: 'insensitive' } },
          { key: { contains: search, mode: 'insensitive' } },
        ],
      }),
    };
    const data = await this.prisma.attributeDefinition.findMany({
      where,
      ...(!noDetail && {
        include: {
          category: { select: { name: true, id: true } }
        }
      })
    });
    return { variant: data };
  }

  async createAttributeDefinition(body: AttributeDefinitionDto) {
    const { categoryIds, ...rest } = body;
    try {
      await this.prisma.attributeDefinition.create({
        data: {
          ...rest,
          ...(categoryIds?.length && { category: { connect: categoryIds.map((id) => ({ id })) } }),
        },
      });
      return { success: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new BadRequestException('این کلید (key) قبلاً استفاده شده است');
        if (error.code === 'P2025') throw new BadRequestException('یکی از دسته‌بندی‌های انتخابی معتبر نیست');
      }
      throw error;
    }
  }

  async updateAttributeDefinition(id: string, body: AttributeDefinitionDto) {
    const { categoryIds, ...rest } = body;
    try {
      await this.prisma.attributeDefinition.update({
        where: { id },
        data: {
          ...rest,
          category: {
            set: categoryIds ? categoryIds.map((id) => ({ id })) : [],
          },
        },
      });
      return { success: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') throw new BadRequestException('این کلید (key) قبلاً استفاده شده است');
        if (error.code === 'P2025') throw new BadRequestException('رکورد مورد نظر یا یکی از دسته‌بندی‌ها یافت نشد');
      }
      throw error;
    }
  }

  async deleteAttributeDefinition(id: string) {
    try {
      await this.prisma.attributeDefinition.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') throw new NotFoundException('ویژگی یافت نشد');
        if (error.code === 'P2003' || error.code === 'P2014') {
          throw new BadRequestException('این ویژگی در حال استفاده است و قابل حذف نیست');
        }
      }
      throw error;
    }
  }
}