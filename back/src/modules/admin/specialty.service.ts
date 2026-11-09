import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ArrayIdDto, CreateSpecialtyDto } from './dto/admin.dto.js';
import { ConfigService } from '@nestjs/config';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import pagination from '../../common/utils/pagination.js';

@Injectable()
export class SpecialtyService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }
    async getAll(title: string, query: QueryDefaultDto) {
        const { limit, page = 1 } = query
        const limitPage = Number(limit) || Number(this.configService.get('limit.admin'))
        const skip = (Number(page) - 1) * limitPage;
        const where = {
            ...(title?.trim() && {
                title: { contains: title.trim(), mode: 'insensitive' as const },
            }),
        };
        const [data, count] = await Promise.all([
            this.prisma.specialty.findMany({ where, orderBy: { title: 'asc' }, skip, take: limitPage }),
            this.prisma.specialty.count({ where }),
        ])
        return {
            specialty: data,
            pagination: pagination(count, page, limitPage)
        }

    }

    async getMy(userId: string) {
        const coach = await this.prisma.coach.findUnique({
            where: { userId }, select: {
                id: true, specialties: {
                    select: {
                        id: true,
                        slug: true,
                        title: true,
                    },
                    orderBy: { title: 'asc' }
                }
            }
        })
        if (!coach) throw new NotFoundException('مربی یافت نشد')
        return coach
    }

    async updateTable(userId: string, dto: ArrayIdDto) {
        const data = await this.prisma.user.findUnique({ where: { id: userId }, select: { coach: { select: { id: true } } } })
        if (!data?.coach?.id) throw new NotFoundException('حساب مربی پیدا نشد !')
        await this.prisma.coach.update({
            where: { id: data.coach.id },
            data: {
                ...(dto.ids?.length && {
                    specialties: { set: dto.ids.map((id) => ({ id })) },
                }),
            }
        })
        return { success: true };
    }

    async getSelector(title: string) {
        const where = {
            ...(title?.trim() && {
                title: { contains: title.trim(), mode: 'insensitive' as const },
            }),
        };
        return this.prisma.specialty.findMany({ where, select: { title: true, id: true, slug: true }, orderBy: { title: 'asc' } })
    }

    // Admin
    async create(dto: CreateSpecialtyDto) {
        const data = await this.prisma.specialty.findUnique({ where: { slug: dto.slug } });
        if (data?.id) throw new ConflictException('این اسلاگ قبلا ثبت شده')
        await this.prisma.specialty.create({ data: dto });
        return { success: true };
    }

    async update(id: string, dto: CreateSpecialtyDto) {
        await this.prisma.specialty.update({ where: { id }, data: dto });
        return { success: true }
    }

    async delete(id: string) {
        const data = await this.prisma.specialty.findUnique({ where: { id } });
        if (!data?.id) throw new ConflictException('رکورد مورد نظر یافت نشد')
        await this.prisma.specialty.delete({ where: { id } })
        return { success: true }
    }
}