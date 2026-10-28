import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateShippingMethodDto, CreateStoreShippingDto, CreateStoreShippingRateDto, UpdateStoreShippingDto } from './dto/shipping.dto.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RolePerson } from '../../generated/prisma/enums.js';

@Injectable()
export class ShippingService {
    constructor(private readonly prisma: PrismaService) { }

    private async getStoreId(userId: string): Promise<string> {
        const storeId = await this.prisma.user.findUnique({ where: { id: userId }, select: { store: { select: { id: true } } } })
        if (!storeId?.store?.id) {
            throw new NotFoundException(`کاربر فعلی هیچ فروشگاهی ندارد !`);
        }
        return storeId?.store?.id
    }

    private filterAvailableShippingMethods(data: any[]) {
        return data
            .map((store) => ({
                ...store,
                storeShippingMethods: store.storeShippingMethods.filter((method: any) => {
                    const hasProvinceRate = method.rates.some(
                        (rate: any) => Number(rate.price) > 0,
                    );
                    const hasDefaultPrice =
                        method.defaultPrice !== null &&
                        Number(method.defaultPrice) > 0;

                    const isFree = method.shippingMethod.isFreeMethod === true;

                    return hasProvinceRate || hasDefaultPrice || isFree;
                }),
            }))
            .filter((store) => store.storeShippingMethods.length > 0);
    }

    async getShippingWithProvince(provinceId: string, userId: string) {

        if (!provinceId || !userId) {
            throw new BadRequestException(`اطلاعات کامل ارسال کنید !`);
        }
        const cartItems = await this.prisma.cartItem.findMany({ where: { userId }, select: { product: { select: { storeId: true } } } })
        const storeIds = [...new Set(
            cartItems
                .map(item => item.product.storeId)
                .filter((id): id is string => id !== null && id !== undefined)
        )]
        if (storeIds.length === 0) {
            throw new NotFoundException('هیچ فروشگاهی در سبد خرید شما یافت نشد');
        }
        const data = await this.prisma.store.findMany({
            where: {
                id: { in: storeIds }
            },
            select: {
                id: true,
                storeShippingMethods: {
                    where: {
                        // defaultPrice: { not: 0 },
                        isActive: true
                    },
                    select: {
                        id: true,
                        description: true,
                        phrase: true,
                        minDays: true,
                        maxDays: true,
                        defaultPrice: true,
                        rates: {
                            where: {
                                provinceId
                            },
                            take: 1,
                            select: { deliveryMaxDays: true, price: true }
                        },
                        shippingMethod: {
                            select: { isFreeMethod: true, name: true, }
                        }
                    },
                }
            }
        })
        const filteredData = this.filterAvailableShippingMethods(data);

        return filteredData
    }

    async createShipping(dto: CreateShippingMethodDto) {
        await this.prisma.shippingMethod.create({
            data: { ...dto },
        });
        return { success: true }
    }

    async updateShipping(id: string, dto: CreateShippingMethodDto) {
        await this.prisma.shippingMethod.update({
            where: { id },
            data: dto,
        });
        return { success: true }
    }

    async findAllShipping(role: RolePerson) {
        return this.prisma.shippingMethod.findMany({
            where: {
                ...(role === 'STORE' && { isActive: true })
            }
        });
    }

    async removeShipping(id: string) {
        await this.prisma.shippingMethod.delete({
            where: { id },
        });
        return { success: true };
    }

    // شیوه ارسال شخصی سازی شده توسط فروشنده StoreShippingMethod
    async createStoreShipping(userId: string, dto: CreateStoreShippingDto) {
        const storeId = await this.getStoreId(userId)
        await this.prisma.storeShippingMethod.create({
            data: { ...dto, storeId: storeId },
        });
        return { success: true };
    }

    async updateStoreShipping(id: string, dto: UpdateStoreShippingDto) {
        await this.prisma.storeShippingMethod.update({
            where: { id },
            data: dto,
        });
        return { success: true };
    }

    async getAllMeStoreShipping(id: string) {
        const storeId = await this.getStoreId(id)
        const shipping = await this.prisma.storeShippingMethod.findMany({
            where: {
                storeId: storeId
            }
        })
        return shipping
    }

    async getOneStoreShipping(id: string) {
        const shipping = await this.prisma.storeShippingMethod.findUnique({
            where: {
                id
            },
            select: {
                rates: {
                    select: {
                        id: true,
                        createdAt: true,
                        price: true,
                        deliveryMaxDays: true,
                        province: { select: { name: true, id: true } }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })
        return shipping?.rates
    }

    async removeStoreShipping(id: string) {
        await this.prisma.storeShippingMethod.delete({
            where: { id },
        });
        return { success: true };
    }

    // ثبت قیمت مختص به استان ها StoreShippingRate
    async createShippingRate(dto: CreateStoreShippingRateDto) {
        await this.prisma.storeShippingRate.create({
            data: { ...dto },
        });
        return { success: true };
    }

    async updateShippingRate(id: string, dto: CreateStoreShippingRateDto) {
        await this.prisma.storeShippingRate.update({
            where: { id },
            data: dto,
        });
        return { success: true };
    }

    async removeShippingRate(id: string) {
        await this.prisma.storeShippingRate.delete({
            where: { id },
        });
        return { success: true };
    }
}