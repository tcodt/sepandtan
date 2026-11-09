import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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

    private async checkMe(id: string, userId?: string) {
        const getCoach = await this.prisma.coach.findUnique({ where: { userId }, select: { id: true } })
        if (!getCoach) throw new NotFoundException('مربی یافت نشد')
        const found = await this.prisma.coachAchievement.findFirst({
            where: { id, ...(getCoach && { coachId: getCoach.id }) },
        });        
        if (!found) throw new NotFoundException('اطلاعات یافت نشد');
        return found
    }

    async updateAchievement(id: string, dto: UpdateAchievementDto, userId: string) {
        console.log(id,userId);
        
        await this.checkMe(id, userId);
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


    async createAchievement(userId: string, dto: CreateAchievementDto) {
        const gatCoach = await this.prisma.coach.findUnique({ where: { userId }, select: { id: true } })
        if (!gatCoach) throw new NotFoundException('مربی یافت نشد')
        const count = await this.prisma.coachAchievement.count({ where: { coachId: gatCoach.id } });
        if (count >= 30) throw new BadRequestException('حداکثر مجاز به ساخت 30 مورد است');

        await this.prisma.coachAchievement.create({
            data: {
                coachId: gatCoach.id,
                title: dto.title,
                type: dto.type,
                scope: dto.scope,
                issuer: dto.issuer,
                place: dto.place,
                eventName: dto.eventName,
                description: dto.description,
                documentUrl: dto.documentUrl,
                year: new Date(dto.year),
                sortOrder:dto.sortOrder,
            },
        });
        return { success: true };
    }

    async getMyAchievement(userId: string, query: QueryDefaultDto) {
        const { limit, page = 1, order } = query
        const gatCoach = await this.prisma.coach.findUnique({ where: { userId }, select: { id: true } })
        if (!gatCoach) throw new NotFoundException('مربی یافت نشد')
        const limitPage = Number(limit) || Number(this.configService.get('limit.coach'))
        const skip = (Number(page) - 1) * limitPage;
        const [data, count] = await Promise.all([
            this.prisma.coachAchievement.findMany({
                where: { coachId: gatCoach.id },
                skip, take: limitPage,
                orderBy: { sortOrder: 'asc' }
            }),
            this.prisma.coachAchievement.count({ where: { coachId: gatCoach.id } })
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

    async deleteAchievement(id: string, userId: string) {
        await this.checkMe(id, userId)
        await this.prisma.coachAchievement.delete({ where: { id } })
        return { success: true }
    }
}
