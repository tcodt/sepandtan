import {
    Injectable,
    NotFoundException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ArrayIdDto, CreateEquipmentDto } from './dto/admin.dto.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import pagination from '../../common/utils/pagination.js';
import { ConfigService } from '@nestjs/config';
import { RolePerson } from '../../generated/prisma/enums.js';

@Injectable()
export class EquipmentService {
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

        const [data, count] = await Promise.all([
            this.prisma.equipment.findMany({
                skip,
                take: limitPage,
                orderBy: { title: 'asc' },
            }),
            this.prisma.equipment.count(),
        ]);

        return {
            equipment: data,
            pagination: pagination(count, page, limitPage),
        };
    }

    async getSelector() {
        return this.prisma.equipment.findMany({
            select: { id: true, title: true, image: true },
            orderBy: { title: 'asc' },
        });
    }

    async updateTableUser(userId: string, dto: ArrayIdDto) {
        await this.prisma.profile.update({
            where: { userId: userId },
            data: {
                ...(dto.ids?.length && {
                    equipment: { set: dto.ids.map((id) => ({ id })) },
                })
            }
        })
        return { success: true };
    }

    // ---------- Admin ----------

    async create(dto: CreateEquipmentDto) {
        const exists = await this.prisma.equipment.findUnique({ where: { slug: dto.slug } });
        if (exists) throw new ConflictException('این تجهیزات قبلاً ثبت شده');

        await this.prisma.equipment.create({
            data: {
                title: dto.title,
                slug: dto.slug,
                image: dto.image,
                description: dto.description,
            },
        });
        return { success: true };
    }

    async update(id: string, dto: CreateEquipmentDto) {
        const found = await this.prisma.equipment.findUnique({ where: { id } });
        if (!found) throw new NotFoundException('تجهیزات یافت نشد');

        const data: any = { ...dto };

        await this.prisma.equipment.update({ where: { id }, data });
        return { success: true };
    }

    async delete(id: string) {
        const found = await this.prisma.equipment.findUnique({
            where: { id },
            include: {
                _count: { select: { exercises: true, profile: true } },
            },
        });
        if (!found) throw new NotFoundException('تجهیزات یافت نشد');

        const usage = found._count.exercises + found._count.profile;
        if (usage > 0) {
            throw new ConflictException(
                'این تجهیزات در تمرین‌ها یا پروفایل کاربران استفاده شده و قابل حذف نیست',
            );
        }

        await this.prisma.equipment.delete({ where: { id } });
        return { success: true };
    }
}