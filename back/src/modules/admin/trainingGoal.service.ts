import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateTrainingGoalDto } from './dto/admin.dto.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import pagination from '../../common/utils/pagination.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TrainingGoalService {
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
            ...(title?.trim() && {
                title: { contains: title.trim(), mode: 'insensitive' as const },
            }),
        };

        const [data, count] = await Promise.all([
            this.prisma.trainingGoal.findMany({
                where,
                skip,
                take: limitPage,
                orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
            }),
            this.prisma.trainingGoal.count({ where }), // مهم
        ]);

        return {
            trainingGoal: data,
            pagination: pagination(count, page, limitPage),
        };
    }

    async getSelector(title: string) {
        const where = {
            ...(title?.trim() && {
                title: { contains: title.trim(), mode: 'insensitive' as const },
            }),
        };
        return this.prisma.trainingGoal.findMany({
            where,
            select: { id: true, title: true, logo: true },
            orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
        });
    }

    // ---------- Admin ----------

    async create(dto: CreateTrainingGoalDto) {
        const exists = await this.prisma.trainingGoal.findFirst({
            where: { title: { equals: dto.title, mode: 'insensitive' } },
        });
        if (exists) throw new ConflictException('این هدف تمرینی قبلاً ثبت شده');

        await this.prisma.trainingGoal.create({
            data: {
                title: dto.title,
                logo: dto.logo,
                description: dto.description,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
        return { success: true };
    }

    async update(id: string, dto: CreateTrainingGoalDto) {
        const found = await this.prisma.trainingGoal.findUnique({ where: { id } });
        if (!found) throw new NotFoundException('هدف تمرینی یافت نشد');

        if (dto.title && dto.title !== found.title) {
            const exists = await this.prisma.trainingGoal.findFirst({
                where: {
                    title: { equals: dto.title, mode: 'insensitive' },
                    id: { not: id },
                },
            });
            if (exists)
                throw new ConflictException('هدف تمرینی با این عنوان قبلاً ثبت شده');
        }

        await this.prisma.trainingGoal.update({ where: { id }, data: dto });
        return { success: true };
    }

    async delete(id: string) {
        const found = await this.prisma.trainingGoal.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { profile: true, workoutPlans: true, dietPlans: true },
                },
            },
        });
        if (!found) throw new NotFoundException('هدف تمرینی یافت نشد');

        const usage =
            found._count.profile +
            found._count.workoutPlans +
            found._count.dietPlans;

        if (usage > 0) {
            throw new ConflictException(
                'این هدف تمرینی در برنامه‌ها یا پروفایل کاربران استفاده شده و قابل حذف نیست',
            );
        }

        await this.prisma.trainingGoal.delete({ where: { id } });
        return { success: true };
    }
}