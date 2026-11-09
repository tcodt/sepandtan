import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateFoodDto, SearchFoodDto } from './dto/admin.dto.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import pagination from '../../common/utils/pagination.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FoodService {
    constructor(private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    // Public
    async getAll(name: string, query: QueryDefaultDto) {
        const { limit, page = 1 } = query
        const limitPage = Number(limit) || Number(this.configService.get('limit.admin'))
        const where = {
            ...(name?.trim() && { name: { contains: name.trim(), mode: 'insensitive' as const } }),
            isActive: true
        };
        const skip = (Number(page) - 1) * limitPage;
        const [data, count] = await Promise.all([
            this.prisma.food.findMany({ where, skip, take: limitPage, orderBy: { name: 'asc' } }),
            this.prisma.food.count({ where }),
        ])
        return {
            food: data,
            pagination: pagination(count, page, limitPage)
        }
    }

    async getSelector(name: string) {
        const where = {
            ...(name?.trim() && { name: { contains: name.trim(), mode: 'insensitive' as const } }),
        };
        return this.prisma.food.findMany({ where, select: { name: true, id: true }, orderBy: { name: 'asc' } })
    }

    // Admin
    async getAllAdmin(query: SearchFoodDto) {
        const { limit, page = 1, name, isActive } = query
        const where = {
            ...(name?.trim() && { name: { contains: name.trim(), mode: 'insensitive' as const } }),
            ...(isActive !== undefined && { isActive })
        };
        const limitPage = Number(limit) || Number(this.configService.get('limit.admin'))
        const skip = (Number(page) - 1) * limitPage;
        const [data, count] = await Promise.all([
            this.prisma.food.findMany({ where, skip, take: limitPage, orderBy: { name: 'asc' } }),
            this.prisma.food.count({ where }),
        ])
        return {
            food: data,
            pagination: pagination(count, page, limitPage)
        }
    }

    async create(dto: CreateFoodDto) {
        const data = await this.prisma.food.findUnique({ where: { name: dto.name } });
        if (data?.id) throw new ConflictException('این اسلاگ قبلا ثبت شده')
        await this.prisma.food.create({ data: dto });
        return { success: true };
    }

    async update(id: string, dto: CreateFoodDto) {
        await this.prisma.food.update({ where: { id }, data: dto });
        return { success: true }
    }

    async delete(id: string) {
        const data = await this.prisma.food.findUnique({ where: { id } });
        if (!data?.id) throw new NotFoundException('رکورد مورد نظر یافت نشد')
        await this.prisma.food.delete({ where: { id } })
        return { success: true }
    }
}