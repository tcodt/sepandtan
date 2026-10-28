/**
 * CartService - سرویس مدیریت سبد خرید
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) { }

  private groupCartByStore(cartItems: any[]) {
    const storesMap = new Map();

    for (const item of cartItems) {
      const storeId = item.product.storeId;

      if (!storesMap.has(storeId)) {
        storesMap.set(storeId, {
          storeId: storeId,
          storeName: item.product.store.name,
          storeSlug: item.product.store.slug,
          commissionRate: item.product.store.commissionRate,
          carts: [],
        });
      }
      const store = storesMap.get(storeId);
      const price = Number(item.variant.price);
      const discountValue = item.variant.discount?.isActive
        ? (item.variant.discount.type === 'fixed'
          ? Number(item.variant.discount.value)
          : price * (Number(item.variant.discount.value) / 100))
        : 0;

      const finalPrice = price - discountValue;
      const totalPrice = finalPrice * item.quantity;
      const totalDiscount = discountValue * item.quantity;

      store.carts.push({
        ...item,
        totalPrice,
        totalDiscount,
      });
    }
    const stores = Array.from(storesMap.values());
    return {
      stores,
    };
  }
  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId: userId },
      select: {
        id: true,
        quantity: true,
        createdAt: true,
        variantId: true,
        product: {
          select: {
            id: true,
            storeId: true,
            title: true,
            slug: true,
            store: { select: { commissionRate: true, name: true, slug: true } },
            images: { select: { alt: true, url: true }, take: 1, orderBy: { createdAt: 'desc' } }
          }
        },
        variant: {
          select: {
            name: true,

            id: true,
            color: { select: { name: true } },
            price: true,
            sku: true,
            attributes: { select: { value: true, id: true, attribute: { select: { key: true, label: true, id: true } } }, take: 2 },
            discount: { select: { isActive: true, value: true, id: true, type: true, endsAt: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const totalPrice = items.reduce((sum, item) => {
      const rawPrice = Number(item.variant?.price ?? 0);
      const discount = item.variant?.discount;
      let finalUnitPrice = rawPrice;
      const isDiscountValid =
        discount &&
        discount.isActive &&
        (!discount.endsAt || new Date(discount.endsAt) > new Date());
      if (isDiscountValid) {
        if (discount.type === 'PERCENTAGE') {
          finalUnitPrice = rawPrice - (rawPrice * (Number(discount.value) / 100));
        } else if (discount.type === 'FIXED' || discount.type === 'PERCENTAGE') {
          finalUnitPrice = Math.max(0, rawPrice - Number(discount.value));
        }
      }

      return sum + (finalUnitPrice * item.quantity);
    }, 0);

    const { stores } = this.groupCartByStore(items)
    return { totalItems: totalItems || 0, totalPrice, stores };
  }

  /**
   * اضافه کردن محصول به سبد خرید
   */
  async addItem(userId: string, dto: AddToCartDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product || product.status !== 'APPROVED') throw new NotFoundException('محصول یافت نشد');

    // Get default variant for stock check
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.variantId },
    });
    if (!variant) throw new NotFoundException('محصول تنوع ندارد');
    if (variant.quantity < 1) throw new BadRequestException('محصول ناموجود است');

    const addQty = dto.quantity || 1;

    await this.prisma.cartItem.create({
      data: { userId, productId: dto.productId, variantId: variant.id, quantity: addQty }
    });
    return { success: true }
  }

  /**
   * به‌روزرسانی تعداد یک آیتم (با productId)
   */
  async updateItem(id: string, dto: UpdateCartItemDto) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id },
      include: { product: true, variant: true },
    });
    if (!item) throw new NotFoundException('آیتم در سبد خرید یافت نشد');

    // Guard against negative quantities
    if (dto.quantity < 0) throw new BadRequestException('تعداد نمی‌تواند منفی باشد');

    if (dto.quantity === 0) {
      return this.prisma.cartItem.delete({ where: { id: item.id } });
    }

    // Check stock limit via variant
    if (dto.quantity > item.variant.quantity) {
      throw new BadRequestException(`موجودی کافی نیست. موجود فعلی: ${item.variant.quantity}`);
    }

    await this.prisma.cartItem.update({ where: { id: item.id }, data: { quantity: dto.quantity } });
    return { suceess: true }
  }

  /**
   * حذف یک آیتم از سبد خرید (با productId)
   */
  async removeItem(id: string) {
    const item = await this.prisma.cartItem.delete({ where: { id } });
    if (!item) throw new NotFoundException('آیتم در سبد خرید یافت نشد');
    return { success: true }
  }

  /**
   * خالی کردن کامل سبد خرید
   */
  async clearCart(userId: string) {
    this.prisma.cartItem.deleteMany({ where: { userId } });
    return { success: true }
  }
}