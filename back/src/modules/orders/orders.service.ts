
import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { CheckoutItemDto, CreateCheckoutDto, SearchCheckouts, SearchOrders, UpdateCheckoutDto, updateStoreOrderDto } from "./dto/order.dto.js";
import { OrderStatus, Prisma, RolePerson } from "../../generated/prisma/client.js";
import { PrismaService } from "../../prisma/prisma.service.js";
import pagination from "../../common/utils/pagination.js";

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService,
        // private readonly emailService: EmailService,
        private readonly configService: ConfigService,
    ) { }

    private generateTrackingCode(prefix = 'TXN'): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

        const segment = (length: number): string => {
            let result = '';

            for (let i = 0; i < length; i++) {
                result += chars[Math.floor(Math.random() * chars.length)];
            }

            return result;
        };

        return `${prefix}-${segment(4)}-${segment(4)}-${segment(4)}`;
    }

    private generateCheckoutNumber(): string {
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(1000 + Math.random() * 9000);

        return `${timestamp}${random}`;
    }

    private async calculateCheckout(userId: string, body: CreateCheckoutDto) {
        const { addressId, orders, discountId } = body
        const storeIds = [...new Set(orders.map(x => x.storeId))]

        const [address, stores, cartItems, rawDiscount] = await Promise.all([
            this.prisma.address.findFirst({ where: { id: addressId, userId }, include: { city: { select: { name: true } }, province: { select: { name: true } } } }),
            this.prisma.store.findMany({ where: { id: { in: storeIds } }, select: { id: true, name: true, commissionRate: true, taxRate: true } }),
            this.prisma.cartItem.findMany({
                where: { userId, product: { storeId: { in: storeIds } } },
                select: {
                    quantity: true,
                    variant: {
                        select: {
                            id: true, sku: true, price: true,
                            discount: { select: { status: true, isActive: true, value: true, type: true } },
                            color: { select: { name: true, hexCode: true } },
                            attributes: { take: 1, select: { value: true, attribute: { select: { key: true, label: true } } } }
                        }
                    },
                    product: { select: { id: true, title: true, storeId: true } }
                }
            }),
            discountId ? this.prisma.discountCode.findUnique({
                where: { id: discountId },
                select: {
                    id: true, type: true, status: true, value: true, minOrderAmount: true, maxDiscount: true,
                    usageLimit: true, usedCount: true, perUserLimit: true, startsAt: true, endsAt: true, isActive: true,
                    discountCodeStores: { select: { storeId: true } }
                }
            }) : null
        ]) as any

        if (!address) throw new BadRequestException('آدرس نامعتبر است')
        if (stores.length !== storeIds.length) throw new BadRequestException('فروشگاه نامعتبر است')
        if (orders.length !== storeIds.length) throw new BadRequestException('فروشگاه تکراری وجود دارد')
        if (!cartItems.length) throw new BadRequestException('سبد خرید خالی است')
        if (discountId && !rawDiscount) throw new BadRequestException('کد تخفیف معتبر نیست')

        const discount = rawDiscount?.status === 'PRODUCT' ? null : rawDiscount
        const now = new Date()
        if (discount) {
            if (!discount.isActive || discount.startsAt > now || discount.endsAt < now) throw new BadRequestException('کد تخفیف معتبر نیست')
            if (discount.usageLimit > 0 && discount.usedCount >= discount.usageLimit) throw new BadRequestException('سقف استفاده از کد تخفیف تکمیل شده است')
            if (discount.perUserLimit > 0) {
                const used = await this.prisma.discountCodeUsage.count({ where: { discountCodeId: discount.id, userId } })
                if (used >= discount.perUserLimit) throw new BadRequestException('سقف استفاده شما از این کد تخفیف تکمیل شده است')
            }
        }

        const D = (v: any) => new Prisma.Decimal(v || 0)
        const R = (v: Prisma.Decimal) => v.toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP)
        const isPercent = (t: any) => String(t).toLowerCase() === 'percentage'
        const cap = (base: Prisma.Decimal, type: any, value: Prisma.Decimal, max: Prisma.Decimal | null) => {
            if (base.lte(0)) return D(0)
            let amount = isPercent(type) ? base.mul(value).div(100) : value
            if (max?.gt(0)) amount = Prisma.Decimal.min(amount, max)
            return Prisma.Decimal.min(Prisma.Decimal.max(amount, D(0)), base).toDecimalPlaces(0, Prisma.Decimal.ROUND_FLOOR)
        }

        const grouped = new Map<string, { originalPrice: Prisma.Decimal; productDiscount: Prisma.Decimal; items: any[] }>()
        for (const item of cartItems) {
            const storeId = item.product.storeId || ''
            const g = grouped.get(storeId) || { originalPrice: D(0), productDiscount: D(0), items: [] }
            const originalPrice = D(item.variant.price)
            const d = item.variant.discount
            const pd = d?.isActive && d.status === 'PRODUCT' ? cap(originalPrice, d.type, D(d.value), null) : D(0)
            const price = originalPrice.sub(pd)
            g.originalPrice = g.originalPrice.add(originalPrice.mul(item.quantity))
            g.productDiscount = g.productDiscount.add(pd.mul(item.quantity))
            g.items.push({
                sku: item.variant.sku, name: item.product.title,
                price, originalPrice, total: price.mul(item.quantity), quantity: item.quantity, returnedQty: 0,
                attributes: item.variant.attributes.map((x: any) => ({ key: x.attribute.key, value: x.value, label: x.attribute.label })),
                productId: item.product.id, storeId, variantId: item.variant.id,
                colorName: item.variant.color?.name || null, colorHex: item.variant.color?.hexCode || null
            })
            grouped.set(storeId, g)
        }
        if (storeIds.some(id => !grouped.has(id))) throw new BadRequestException('بعضی از کالاها در سبد خرید یافت نشدند')

        const subtotalOf = (id: string) => grouped.get(id)!.originalPrice.sub(grouped.get(id)!.productDiscount)
        const totalSubtotal = storeIds.reduce((s, id) => s.add(subtotalOf(id)), D(0))


        const platformDiscounts = new Map<string, Prisma.Decimal>()
        if (discount?.status === 'PLATFORM' && totalSubtotal.gte(D(discount.minOrderAmount))) {
            const target = cap(totalSubtotal, discount.type, D(discount.value), discount.maxDiscount ? D(discount.maxDiscount) : null)
            const eligible = storeIds.filter(id => subtotalOf(id).gt(0))
            let remain = target
            eligible.forEach((id, i) => {
                const subtotal = subtotalOf(id)
                const share = i === eligible.length - 1 ? remain : Prisma.Decimal.min(remain, subtotal, target.mul(subtotal).div(totalSubtotal).toDecimalPlaces(0, Prisma.Decimal.ROUND_FLOOR))
                if (share.gt(0)) { platformDiscounts.set(id, share); remain = remain.sub(share) }
            })
        }

        const codeDiscountOf = (storeId: string) => {
            if (!discount) return D(0)
            if (discount.status === 'STORE') {
                if (!discount.discountCodeStores.some((x: any) => x.storeId === storeId)) return D(0)
                const subtotal = subtotalOf(storeId)
                return subtotal.lt(D(discount.minOrderAmount)) ? D(0) : cap(subtotal, discount.type, D(discount.value), discount.maxDiscount ? D(discount.maxDiscount) : null)
            }
            return discount.status === 'PLATFORM' ? (platformDiscounts.get(storeId) || D(0)) : D(0)
        }

        const storesResult = storeIds.map(storeId => {
            const store = stores.find((x: any) => x.id === storeId)!
            const g = grouped.get(storeId)!
            const order = orders.find(x => x.storeId === storeId)!
            const subtotal = subtotalOf(storeId)
            const codeDiscount = codeDiscountOf(storeId)
            const totalDiscount = g.productDiscount.add(codeDiscount)
            const shippingCost = D(order.shippingCost)
            const taxRate = D(store.taxRate ?? 10)
            const commissionRate = D(store.commissionRate)

            // مالیات روی مبلغ بعد از تخفیف مشتری (بدون ارسال و بدون تخفیف کمیسیون)
            const net = g.originalPrice.sub(totalDiscount)
            const tax = net.mul(taxRate).div(100)
            const base = net.sub(tax)
            // کمیسیون کامل فروشگاه؛ تخفیف کمیسیون جداست و نرخ/مبلغ کمیسیون را عوض نمی‌کند
            const commissionAmount = base.mul(commissionRate).div(100)

            let commissionDiscount = D(0)
            if (discount?.status === 'COMMISSION' && subtotal.gte(D(discount.minOrderAmount))) {
                // value همیشه واحد درصد است؛ نرخ کمیسیون منفی نمی‌شود؛ سقف maxDiscount به تومان برای هر فروشگاه جدا
                commissionDiscount = base.mul(Prisma.Decimal.min(commissionRate, D(discount.value))).div(100)
                if (D(discount.maxDiscount).gt(0)) commissionDiscount = Prisma.Decimal.min(commissionDiscount, D(discount.maxDiscount))
            }

            const totalPrice = Prisma.Decimal.max(D(0), net.sub(commissionDiscount).add(shippingCost))
            const payoutAmount = g.originalPrice.sub(commissionAmount).sub(totalDiscount).add(shippingCost).sub(tax)

            return {
                storeId,
                shippingCost: R(shippingCost), shippingName: order.shippingName, shippingId: order.shippingId, estimatedDays: String(order.shippingTime),
                storeName: store.name,
                commission: commissionRate.toDecimalPlaces(2),
                commissionAmount: R(commissionAmount),
                commissionDiscountAmount: R(commissionDiscount),
                originalPrice: R(g.originalPrice),
                subtotal: R(subtotal),
                taxAmount: R(tax),
                totalPrice: R(totalPrice),
                discountAmount: R(totalDiscount),
                payoutAmount: R(payoutAmount),
                note: order.note || null,
                discountCodeId: (codeDiscount.gt(0) || commissionDiscount.gt(0)) ? discount.id : null,
                orderItems: g.items
            }
        })

        const sum = (f: (x: typeof storesResult[number]) => Prisma.Decimal) => storesResult.reduce((s, x) => s.add(f(x)), D(0))
        const commissionAmount = sum(x => D(x.commissionAmount))
        const commissionDiscountAmount = sum(x => D(x.commissionDiscountAmount))

        return {
            stores: storesResult,
            checkout: {
                totalOriginal: sum(x => D(x.originalPrice)),
                totalAmount: sum(x => D(x.totalPrice)),
                discountAmount: sum(x => D(x.discountAmount)),
                commissionAmount,
                commissionDiscountAmount,
                taxAmount: sum(x => D(x.taxAmount)),
                salesProfit: commissionAmount.sub(commissionDiscountAmount),
                discountType: discount?.status ?? null,
                discountCodeId: discount?.id ?? null
            },
            address
        }
    }

    private validateCheckoutResult(
        checkout: any,
        stores: any[],
        address: any,
    ): void {
        if (!checkout) {
            throw new BadRequestException('اطلاعات محاسبه سفارش دریافت نشد.');
        }

        if (!address?.id) {
            throw new BadRequestException('آدرس ارسال سفارش معتبر نیست.');
        }

        if (!Array.isArray(stores) || stores.length === 0) {
            throw new BadRequestException(
                'هیچ فروشگاهی برای ثبت سفارش یافت نشد.',
            );
        }

        const requiredCheckoutFields = [
            'totalOriginal',
            'totalAmount',
            'discountAmount',
            'commissionAmount',
            'taxAmount',
            'salesProfit',
        ];

        for (const field of requiredCheckoutFields) {
            const value = Number(checkout[field]);

            if (!Number.isFinite(value) || value < 0) {
                throw new BadRequestException(
                    `مقدار ${field} در اطلاعات سفارش معتبر نیست.`,
                );
            }
        }

        for (const store of stores) {
            if (!store.storeId) {
                throw new BadRequestException(
                    'شناسه فروشگاه در اطلاعات سفارش وجود ندارد.',
                );
            }

            if (!store.shippingId) {
                throw new BadRequestException(
                    `روش ارسال فروشگاه ${store.storeName} مشخص نشده است.`,
                );
            }

            if (!Array.isArray(store.orderItems) || store.orderItems.length === 0) {
                throw new BadRequestException(
                    `هیچ محصولی برای فروشگاه ${store.storeName} وجود ندارد.`,
                );
            }

            const numericFields = [
                'shippingCost',
                'commission',
                'commissionAmount',
                'originalPrice',
                'subtotal',
                'taxAmount',
                'totalPrice',
                'discountAmount',
                'payoutAmount',
            ];

            for (const field of numericFields) {
                const value = Number(store[field]);

                if (!Number.isFinite(value) || value < 0) {
                    throw new BadRequestException(
                        `مقدار ${field} برای فروشگاه ${store.storeName} معتبر نیست.`,
                    );
                }
            }

            for (const item of store.orderItems) {
                if (
                    !item.productId ||
                    !item.variantId ||
                    !item.sku ||
                    !item.quantity ||
                    item.quantity <= 0
                ) {
                    throw new BadRequestException(
                        `اطلاعات محصول ${item.name ?? ''} برای ثبت سفارش ناقص است.`,
                    );
                }

                if (!Number.isFinite(Number(item.price)) || Number(item.price) < 0) {
                    throw new BadRequestException(
                        `قیمت محصول ${item.name ?? ''} معتبر نیست.`,
                    );
                }

                if (!Number.isFinite(Number(item.total)) || Number(item.total) < 0) {
                    throw new BadRequestException(
                        `مبلغ محصول ${item.name ?? ''} معتبر نیست.`,
                    );
                }
            }
        }
    }

    async createCheckout(userId: string, body: CreateCheckoutDto) {
        const { address, checkout, stores } = await this.calculateCheckout(userId, body);
        this.validateCheckoutResult(checkout, stores, address);

        // return {
        //     address,
        //     checkout, stores
        // }
        await this.prisma.$transaction(async (tx) => {
            const createdCheckout = await tx.checkout.create({
                data: {
                    checkoutNumber: this.generateCheckoutNumber(),
                    commissionAmount: checkout.commissionAmount,
                    salesProfit: checkout.salesProfit,
                    totalAmount: checkout.totalAmount,
                    discountAmount: checkout.commissionDiscountAmount || checkout.discountAmount,
                    taxAmount: checkout.taxAmount,
                    discountStatus: checkout.discountType,
                    shippingName: address.fullName,
                    shippingPhone: address.phone,
                    shippingCity: address.city?.name,
                    shippingProvince: address.province?.name,
                    shippingAddress: address.address,
                    shippingPostal: address.postalCode,
                    discountId: checkout.discountCodeId || null,
                    userId,
                    addressId: address.id,
                },
            });
            const createdOrders = [] as any;
            for (const store of stores) {
                const order = await tx.order.create({
                    data: {
                        orderNumber: this.generateCheckoutNumber(),
                        status: 'PENDING',
                        shippingCost: store.shippingCost,
                        shippingName: store.shippingName,
                        storeName: store.storeName,
                        commission: store.commission,
                        commissionAmount: store.commissionAmount,
                        subtotal: store.subtotal,
                        totalPrice: store.totalPrice,
                        discountAmount: store.discountAmount,
                        note: store.note || null,
                        checkoutId: createdCheckout.id,
                        storeId: store.storeId,
                        userId,
                        storeShippingMethodId: store.shippingId || null,
                        discountCodeId: store.discountCodeId || null,
                        taxAmount: store.taxAmount,
                        items: {
                            create: store.orderItems.map((item) => ({
                                sku: item.sku,
                                name: item.name,

                                price: item.price,
                                originalPrice: item.originalPrice,
                                total: item.total,
                                quantity: item.quantity,
                                returnedQty: item.returnedQty ?? 0,
                                attributes: item.attributes ?? null,
                                colorName: item.colorName ?? null,
                                colorHex: item.colorHex ?? null,
                                productId: item.productId,
                                storeId: item.storeId,
                                variantId: item.variantId,
                            })),
                        },
                    },
                    include: {
                        items: true,
                    },
                });
                createdOrders.push(order);
                for (const item of store.orderItems) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            saleCount: {
                                increment: item.quantity,
                            },
                        },
                    });
                    const result = await tx.productVariant.updateMany({
                        where: {
                            id: item.variantId,
                            quantity: {
                                gte: item.quantity,
                            },
                        },
                        data: {
                            quantity: {
                                decrement: item.quantity,
                            },
                            saleCount: {
                                increment: item.quantity,
                            },
                        },
                    });
                    if (result.count === 0) {
                        throw new BadRequestException(
                            `موجودی محصول ${item.name} کافی نیست.`,
                        );
                    }
                }
            }
            await tx.cartItem.deleteMany({ where: { userId } })
            return {
                success: true,
                checkout: createdCheckout,
                orders: createdOrders,
                address,
            };
        });
        return { success: true }
    }

    async getAdminOrder(query: SearchOrders) {
        const { limit, page = 1, paymentStatus, userId } = query
        const limitPage = Number(limit) || Number(this.configService.get('limit.orders') || 10);
        const skip = (Number(page) - 1) * limitPage;
        const where = {
            // ...(paymentStatus && paymentStatus !== 'All' && { paymentStatus }),
            // ...(userId && { userId }),
        }
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                skip, take: limitPage, orderBy: { createdAt: 'desc' }
            }),
            this.prisma.order.count({ where }),
        ]);

        return { orders, pagination: pagination(total, page, limitPage) }
    }

    async getAdminChekout(query: SearchCheckouts) {
        const { limit, page = 1, paymentStatus, userId } = query
        const limitPage = Number(limit) || Number(this.configService.get('limit.orders') || 10);
        const skip = (Number(page) - 1) * limitPage;
        const where = {
            ...(paymentStatus && paymentStatus !== 'All' && { paymentStatus }),
            ...(userId && { userId }),
        }
        const [checkouts, total] = await Promise.all([
            this.prisma.checkout.findMany({
                where,
                skip, take: limitPage, orderBy: { createdAt: 'desc' }
            }),
            this.prisma.checkout.count({ where }),
        ]);
        return { checkouts, pagination: pagination(total, page, limitPage) }
    }

    async getStoresOrder(storeId: string, query: SearchOrders) {
        const { limit, page = 1 } = query
        const limitPage = Number(limit) || Number(this.configService.get('limit.orders') || 10);

        const skip = (Number(page) - 1) * limitPage;
        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where: {
                    storeId
                },
                skip, take: limitPage, orderBy: { createdAt: 'desc' }
            }),
            this.prisma.order.count({ where: { storeId } }),
        ]);
        return { orders, pagination: pagination(total, page, limitPage) }
    }

    async getMyChekout(userId: string, query: SearchCheckouts) {
        const { limit = 1, page = 1, paymentStatus, status } = query
        const limitPage = Number(limit) || Number(this.configService.get('limit.orders') || 10);
        const skip = (Number(page) - 1) * limitPage;
        const where = {
            userId,
            ...(status && status !== 'All' && { status }),
            ...(paymentStatus && paymentStatus !== 'All' && { paymentStatus })
        }
        const [checkouts, total] = await Promise.all([
            this.prisma.checkout.findMany({
                where,
                select: {
                    checkoutNumber: true,
                    createdAt: true,
                    id: true,
                    discountAmount: true,
                    paymentMethod: true,
                    paymentStatus: true,
                    status: true,
                    paymentRef: true,
                    totalAmount: true,
                    userId: true
                },
                skip, take: limitPage, orderBy: { createdAt: 'desc' }
            }),
            this.prisma.checkout.count({ where }),
        ]);
        return { checkouts, pagination: pagination(total, page, limitPage) }
    }

    async updateCheckout(id: string, body: UpdateCheckoutDto, role: RolePerson) {
        const data = await this.prisma.checkout.update({
            where: { id },
            data: (role === 'ADMIN' || role === 'SUPERADMIN') ? { ...body } : { status: body.status }
        })

        if (data.status === 'CANCELLED') {
            await this.cancelCheckout(data.id, data.userId)
        }

        if (data.status === 'RETURNED') {

        }
        return { success: true }
    }

    async cancelCheckout(checkoutId: string, userId: string) {
        return this.prisma.$transaction(async tx => {
            const items = (await tx.orderItem.findMany({
                where: { order: { checkoutId, userId, status: 'PENDING' } },
                select: { productId: true, variantId: true, quantity: true },
            }));
            if (!items.length) throw new BadRequestException('این سفارش قابل لغو نیست.');
            await Promise.all(items.flatMap(({ productId, variantId, quantity }) => [
                tx.productVariant.update({
                    where: { id: variantId },
                    data: { quantity: { increment: quantity }, saleCount: { decrement: quantity } },
                }),
                tx.product.update({
                    where: { id: productId },
                    data: { saleCount: { decrement: quantity } },
                }),
            ]));
            await tx.order.updateMany({
                where: { checkoutId, userId, status: 'PENDING' },
                data: { status: 'CANCELLED', cancelledAt: new Date() },
            });
            return { success: true };
        });
    }

    async updateOrderStore(id: string, body: updateStoreOrderDto) {
        const order = await this.prisma.order.update({
            where: { id, storeId: body.storeId },
            data: { status: body.status },
            select: { checkoutId: true },
        });
        const statuses = await this.prisma.order.findMany({
            where: { checkoutId: order.checkoutId },
            select: { status: true },
        });
        const priority: OrderStatus[] = [
            'CANCELLED',
            'RETURNED',
            'PENDING',
            'CONFIRMED',
            'PROCESSING',
            'SHIPPED',
            'DELIVERED',
        ];

        const checkoutStatus =
            statuses.every(x => x.status === 'DELIVERED') ? 'DELIVERED' :
                statuses.every(x => x.status === 'CANCELLED') ? 'CANCELLED' :
                    statuses.every(x => x.status === 'RETURNED') ? 'RETURNED' :
                        priority.find(status => statuses.some(x => x.status === status)) ?? 'PENDING';

        await this.prisma.checkout.update({
            where: { id: order.checkoutId },
            data: { status: checkoutStatus },
        });
        return { success: true };
    }

    async updatePaymentCheckout(checkoutId: string) {
        return this.prisma.$transaction(async (tx) => {
            // پرداخت فقط یک بار از pending به paid تغییر می‌کند
            const checkout = await tx.checkout.update({
                where: {
                    id: checkoutId,
                    paymentStatus: 'PENDING',
                },
                data: {
                    paymentStatus: 'PAID',
                },
                select: {
                    id: true,
                    checkoutNumber: true,
                    taxAmount: true,
                    salesProfit: true,
                    orders: {
                        select: {
                            id: true,
                            returnDeadline: true,
                            totalPrice: true,
                            commissionAmount: true,
                            taxAmount: true,
                            store: {
                                select: {
                                    owner: {
                                        select: {
                                            id: true,
                                            wallet: {
                                                select: {
                                                    id: true,
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
            const superAdmin = await tx.user.findFirst({ where: { role: 'SUPERADMIN' }, select: { id: true, wallet: { select: { id: true } } } })
            if (!checkout.orders.length || !superAdmin?.id || !superAdmin?.wallet?.id) {
                throw new BadRequestException('سفارشی برای این پرداخت پیدا نشد.');
            }
            const deadLine = new Date(
                Date.now() + 7 * 24 * 60 * 60 * 1000,
            );

            for (const order of checkout.orders) {
                const seller = order.store.owner;
                const wallet = seller.wallet;
                const deadLine = order.returnDeadline
                if (!wallet) {
                    throw new BadRequestException(`کیف پول فروشنده سفارش ${order.id} پیدا نشد.`,);
                }
                // const settlementDate = new Date(deadLine);
                // settlementDate.setDate(settlementDate.getDate() + 1);

                const total = new Prisma.Decimal(order.totalPrice);
                const commission = new Prisma.Decimal(order.commissionAmount,);
                const tax = new Prisma.Decimal(order.taxAmount);
                const sellerAmount = total.minus(commission).minus(tax);

                if (total.lte(0) || commission.lt(0) || tax.lt(0) || sellerAmount.lt(0)) {
                    throw new BadRequestException(`مبالغ مالی سفارش ${order.id} معتبر نیستند.`);
                }

                // فقط سهم خالص فروشنده وارد موجودی در انتظار می‌شود
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: {
                        pendingBalance: { increment: sellerAmount },
                    },
                });

                // 1. سهم خالص فروشنده؛ منتظر موعد تسویه
                await tx.walletTransaction.create({
                    data: {
                        type: 'SALE_SETTLEMENT',
                        status: 'PENDING',
                        amount: sellerAmount,
                        trackingCode: this.generateTrackingCode('SET'),
                        userId: seller.id,
                        walletId: wallet.id,
                        orderId: order.id,
                        settlementDate: deadLine
                    },
                });
                // 2. کمیسیون؛ ردیف توضیحی صورتحساب، بدون کسر مجدد از کیف پول
                if (commission.gt(0)) {
                    await tx.walletTransaction.create({
                        data: {
                            type: 'COMMISSION',
                            status: 'COMPLETED',
                            amount: commission,
                            trackingCode: this.generateTrackingCode('COM'),
                            userId: seller.id,
                            walletId: wallet.id,
                            orderId: order.id,
                        },
                    });
                }

                // 3. مالیات؛ ردیف توضیحی صورتحساب
                if (tax.gt(0)) {
                    await tx.walletTransaction.create({
                        data: {
                            type: 'TAX',
                            status: 'COMPLETED',
                            amount: tax,
                            trackingCode: this.generateTrackingCode('TAX'),
                            userId: seller.id,
                            walletId: wallet.id,
                            orderId: order.id,
                        },
                    });
                }
            }
            await tx.walletTransaction.createMany({
                data: [
                    {
                        amount: checkout.salesProfit,
                        type: 'DEPOSIT',
                        trackingCode: this.generateTrackingCode('DES'),
                        status: 'COMPLETED',
                        userId: superAdmin?.id,
                        walletId: superAdmin.wallet.id,
                        description: ` سود سفارش ${checkout.checkoutNumber} `,
                    },
                    {
                        amount: checkout.taxAmount,
                        type: 'TAX',
                        trackingCode: this.generateTrackingCode('TAX'),
                        status: 'COMPLETED',
                        userId: superAdmin?.id,
                        walletId: superAdmin.wallet.id,
                        description: ` مالیات سفارش ${checkout.checkoutNumber} `,
                    },
                ]
            })
            await tx.wallet.update({
                where: {
                    id: superAdmin.wallet.id
                },
                data: {
                    balance: { increment: checkout.salesProfit },
                    pendingBalance: { increment: checkout.taxAmount },
                }
            })
            await tx.order.updateMany({
                where: { checkoutId: checkoutId },
                data: { status: 'CONFIRMED' }
            })
            await tx.checkout.update({
                where: { id: checkoutId },
                data: { status: 'CONFIRMED' }
            })

            return { success: true, };
        });
    }

    async getDetailCheckout(id: string) {
        const data = await this.prisma.checkout.findUnique({
            where: {
                id
            },
            include: {
                orders: {
                    include: {
                        items: {
                            select: {
                                sku: true,
                                name: true,

                                price: true,
                                originalPrice: true,
                                total: true,
                                quantity: true,
                                returnedQty: true,
                                attributes: true,
                                colorName: true,
                                colorHex: true,
                                productId: true
                            }
                        }
                    }
                }
            }
        })
        return data
    }

    async deleteCheckout(id: string) {
        const data = await this.prisma.checkout.findUnique({ where: { id } })
        if (!data || data.paymentStatus === 'PAID') throw new BadRequestException('درخواست ممکن نیست سفارش پرداخت شده است')
        await this.prisma.checkout.delete({ where: { id } })
        return { success: true }
    }
}