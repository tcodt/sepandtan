import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateMuscleGroupDto } from './dto/admin.dto.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import pagination from '../../common/utils/pagination.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MuscleGroupService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    private getLimit(limit?: number | string) {
        return Math.max(
            1,
            Number(limit) || Number(this.configService.get('limit.admin')) || 10,
        );
    }

    // ---------- Public ----------

    async getAll(title: string, query: QueryDefaultDto) {
        const { limit, page = 1 } = query;
        const limitPage = this.getLimit(limit);
        const skip = (Math.max(1, Number(page)) - 1) * limitPage;
        const where = {
            ...(title && { title })
        }
        const [data, count] = await Promise.all([
            this.prisma.muscleGroup.findMany({
                where,
                skip,
                take: limitPage,
                orderBy: { title: 'asc' },
            }),
            this.prisma.muscleGroup.count(),
        ]);

        return {
            muscleGroup: data,
            pagination: pagination(count, page, limitPage),
        };
    }

    async getOne(slug: string) {
        const data = await this.prisma.muscleGroup.findUnique({
            where: { slug },
            include: {
                _count: { select: { exercises: true } },
            },
        });
        if (!data) throw new NotFoundException('گروه عضلانی یافت نشد');
        return data;
    }

    async getSelector() {
        return this.prisma.muscleGroup.findMany({
            select: { id: true, title: true, slug: true },
            orderBy: { title: 'asc' },
        });
    }

    // ---------- Admin ----------

    async create(dto: CreateMuscleGroupDto) {
        const exists = await this.prisma.muscleGroup.findUnique({
            where: { slug: dto.slug },
        });
        if (exists) throw new ConflictException('این اسلاگ قبلاً ثبت شده');

        await this.prisma.muscleGroup.create({
            data: {
                slug: dto.slug,
                title: dto.title,
            },
        });
        return { success: true };
    }

    async update(id: string, dto: CreateMuscleGroupDto) {
        const found = await this.prisma.muscleGroup.findUnique({ where: { id } });
        if (!found) throw new NotFoundException('گروه عضلانی یافت نشد');

        await this.prisma.muscleGroup.update({ where: { id }, data: dto });
        return { success: true };
    }

    async delete(id: string) {
        const found = await this.prisma.muscleGroup.findUnique({
            where: { id },
            include: { _count: { select: { exercises: true } } },
        });
        if (!found) throw new NotFoundException('گروه عضلانی یافت نشد');

        if (found._count.exercises > 0) {
            throw new ConflictException(
                'این گروه عضلانی در تمرین‌ها استفاده شده و قابل حذف نیست',
            );
        }

        await this.prisma.muscleGroup.delete({ where: { id } });
        return { success: true };
    }
}