import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ArrayIdDto, CreateExerciseDto, SearchExerciseDto } from './dto/admin.dto.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import pagination from '../../common/utils/pagination.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExerciseService {
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

    async getAll(query: QueryDefaultDto) {
        const { limit, page = 1 } = query;
        const limitPage = this.getLimit(limit);
        const skip = (Math.max(1, Number(page)) - 1) * limitPage;

        const where = { isActive: true };

        const [data, count] = await Promise.all([
            this.prisma.exercise.findMany({
                where,
                skip,
                take: limitPage,
                orderBy: { createdAt: 'desc' },
                include: { category: true, muscles: true, equipment: true },
            }),
            this.prisma.exercise.count({ where }),
        ]);

        return {
            exercise: data,
            pagination: pagination(count, page, limitPage),
        };
    }

    async getOne(slug: string) {
        const data = await this.prisma.exercise.findUnique({
            where: { slug },
            include: { category: true, muscles: true, equipment: true },
        });
        if (!data) throw new NotFoundException('تمرین یافت نشد');
        return data;
    }

    async getSelector() {
        return this.prisma.exercise.findMany({
            where: { isActive: true },
            select: { id: true, title: true, slug: true },
            orderBy: { title: 'asc' },
        });
    }

    // ---------- Admin ----------

    
    async getAllAdmin(query: SearchExerciseDto) {
        const { limit, page = 1, title, isActive } = query;
        const limitPage = this.getLimit(limit);
        const skip = (Math.max(1, Number(page)) - 1) * limitPage;
        const where = {
            ...(title && { title }),
            ...(isActive !== undefined && { isActive })
        }
        const [data, count] = await Promise.all([
            this.prisma.exercise.findMany({
                where,
                skip,
                take: limitPage,
                orderBy: { createdAt: 'desc' },
                include: { category: true, muscles: true, equipment: true },
            }),
            this.prisma.exercise.count({ where }),
        ]);

        return {
            exercise: data,
            pagination: pagination(count, page, limitPage),
        };
    }

    async create(dto: CreateExerciseDto) {
        const exists = await this.prisma.exercise.findUnique({ where: { slug: dto.slug } });
        if (exists) throw new ConflictException('این تمرین قبلاً ثبت شده');

        if (
            dto.caloriesMin != null &&
            dto.caloriesMax != null &&
            dto.caloriesMin > dto.caloriesMax
        ) throw new BadRequestException('caloriesMin نمی‌تواند بزرگ‌تر از caloriesMax باشد');


        const { muscleIds, equipmentIds, ...rest } = dto;

        await this.prisma.exercise.create({
            data: {
                ...rest,
                slug: dto.slug,
                notic: dto.notic ?? [],
                stepAction: dto.stepAction ?? [],
                ...(muscleIds?.length && {
                    muscles: { connect: muscleIds.map((id) => ({ id })) },
                }),
                ...(equipmentIds?.length && {
                    equipment: { connect: equipmentIds.map((id) => ({ id })) },
                }),
            },
        });

        return { success: true };
    }

    async update(id: string, dto: CreateExerciseDto) {
        const found = await this.prisma.exercise.findUnique({ where: { id } });
        if (!found) throw new NotFoundException('تمرین یافت نشد');

        if (
            dto.caloriesMin != null &&
            dto.caloriesMax != null &&
            dto.caloriesMin > dto.caloriesMax
        ) throw new BadRequestException('caloriesMin نمی‌تواند بزرگ‌تر از caloriesMax باشد');


        const { muscleIds, equipmentIds, ...rest } = dto;

        await this.prisma.exercise.update({
            where: { id },
            data: {
                ...rest,
                ...(dto.title && { slug: dto.slug }),
                ...(muscleIds && {
                    muscles: { set: muscleIds.map((id) => ({ id })) },
                }),
                ...(equipmentIds && {
                    equipment: { set: equipmentIds.map((id) => ({ id })) },
                }),
            },
        });

        return { success: true };
    }

    async delete(id: string) {
        const found = await this.prisma.exercise.findUnique({ where: { id } });
        if (!found) throw new NotFoundException('تمرین یافت نشد');
        await this.prisma.exercise.update({
            where: { id },
            data: { isActive: false },
        });
        return { success: true };
    }

}