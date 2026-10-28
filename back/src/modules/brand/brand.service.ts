import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BrandDto } from './dto/brand.dts.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import pagination from '../../common/utils/pagination.js';
import { ConfigService } from '@nestjs/config';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';

@Injectable()
export class BrandService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService


    ) { }

    /**
     * دریافت تمام دسته‌بندی‌های فعال (برای کاربران عادی)
     * ساختار درختی با children
     */
    async findAllAdmin(query: QueryDefaultDto) {
        const { limit, page = 1 } = query
        const limitPage = Number(limit) || Number(this.configService.get('limit.color'))
        const skip = (Number(page) - 1) * limitPage;
        const [data, count] = await this.prisma.$transaction([
            this.prisma.brand.findMany({
                include: {
                    _count: { select: { products: true } }
                },
                skip,
                take: limitPage,
                orderBy: { name: 'asc' },
            }),
            this.prisma.brand.count()
        ]);
        return {
            brands: data,
            pagination: pagination(count, page, limitPage),
        }


    }

    async findAll() {
        return this.prisma.brand.findMany({
            select: { id: true, name: true, slug: true, logo: true },
            orderBy: { name: 'asc' },
        });
    }

    async create(dto: BrandDto) {
        await this.prisma.brand.create({
            data: { ...dto },
        });
        return { success: true }
    }

    async update(id: string, dto: BrandDto) {
        const brand = await this.prisma.brand.findUnique({ where: { id } });
        if (!brand) throw new NotFoundException('برند یافت نشد');

        const data: any = { ...dto };
        await this.prisma.brand.update({ where: { id }, data });
        return { success: true }
    }

    async delete(id: string) {
        const brand = await this.prisma.brand.findUnique({
            where: { id },
            include: { _count: { select: { products: true } } },
        });
        if (!brand) throw new NotFoundException('دسته‌بندی یافت نشد');

        if (brand._count.products > 0) {
            throw new BadRequestException(
                `امکان حذف این برند وجود ندارد زیرا ${brand._count.products} محصول به آن متصل است.`
            );
        }

        await this.prisma.brand.delete({ where: { id } });
        return { success: true }
    }
}
