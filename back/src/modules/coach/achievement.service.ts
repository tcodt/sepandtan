import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import { CreateAchievementDto, UpdateAchievementDto } from './dto/coach.dto.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';

@Injectable()
export class AchievementService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    private async checkMe(id: string, coachId?: string) {
        const found = await this.prisma.coachAchievement.findFirst({
            where: { id, ...(coachId && { coachId }) },
        });
        if (!found) throw new NotFoundException('دستاورد یافت نشد');
    }

    async updateAchievement(id: string, dto: UpdateAchievementDto, coachId: string) {
        await this.checkMe(id, coachId);
        const data: any = { ...dto };
        if (dto.year) data.year = new Date(dto.year);
        await this.prisma.coachAchievement.update({ where: { id }, data });
        return { success: true };
    }

    async changeVerify(id: string) {
        const data = await this.prisma.coachAchievement.findUnique({ where: { id }, select: { isVerified: true } });
        if (!data) throw new NotFoundException('دستاورد مورد نظر یافت نشد');
        const newData = await this.prisma.coachAchievement.update({ where: { id }, data: { isVerified: !data.isVerified } });
        return { success: true, message: newData.isVerified ? 'دستاورد تأیید شد' : 'تأیید دستاورد لغو شد' };
    }


    async createAchievement(coachId: string, dto: CreateAchievementDto) {
        const max = await this.prisma.coachAchievement.aggregate({
            where: { coachId },
            _max: { sortOrder: true },
        });
        await this.prisma.coachAchievement.create({
            data: {
                coachId,
                title: dto.title,
                type: dto.type,
                scope: dto.scope,
                issuer: dto.issuer,
                place: dto.place,
                eventName: dto.eventName,
                description: dto.description,
                documentUrl: dto.documentUrl,
                year: new Date(dto.year),
                sortOrder: (max._max.sortOrder ?? 0) + 1,
            },
        });
        return { success: true };
    }


    async getMyAchievement(coachId: string, query: QueryDefaultDto) {
        const { limit, page = 1, order } = query
        const limitPage = Number(limit) || Number(this.configService.get('limit.coach'))
        const skip = (Number(page) - 1) * limitPage;
        const [data, count] = await Promise.all([
            this.prisma.coachAchievement.findMany({
                where: { coachId },
                skip, take: limitPage,
                orderBy: { sortOrder: 'asc' }
            }),
            this.prisma.coachAchievement.count({ where: { coachId } })
        ])
        return {
            achievement: data,
            pagination: pagination(count, page, limitPage)
        }
    }

    async getAllAchievementCoach(coachId: string, query: QueryDefaultDto) {
        const { limit, page = 1 } = query
        const limitPage = Number(limit) || Number(this.configService.get('limit.coach'))
        const skip = (Number(page) - 1) * limitPage;
        const [data, count] = await Promise.all([
            this.prisma.coachAchievement.findMany({
                where: { coachId, isVerified: true },
                skip, take: limitPage,
                orderBy: { sortOrder: 'asc' }
            }),
            this.prisma.coachAchievement.count({ where: { coachId, isVerified: true } })
        ])
        return {
            achievement: data,
            pagination: pagination(count, page, limitPage)
        }
    }

    async deleteAchievement(id: string, coachId: string) {
        await this.checkMe(id, coachId)
        await this.prisma.coachAchievement.delete({ where: { id } })
        return { success: true }
    }
}
