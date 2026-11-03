import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ArrayIdDto, CreateSpecialtyDto } from './dto/admin.dto.js';

@Injectable()
export class SpecialtyService {
    constructor(private readonly prisma: PrismaService) { }
    async getAll() {
        return this.prisma.specialty.findMany({ orderBy: { title: 'asc' } })
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

    async getSelector() {
        return this.prisma.specialty.findMany({ select: { title: true, id: true }, orderBy: { title: 'asc' } })
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