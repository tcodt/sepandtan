import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAvailabilityDto, UpdateAvailabilityDto } from './dto/coach.dto.js';

@Injectable()
export class AvailableService {
    constructor(private readonly prisma: PrismaService) { }

    async createAvailable(userId: string, dto: CreateAvailabilityDto) {
        const gatId = await this.prisma.coach.findUnique({ where: { userId }, select: { id: true } })
        if (!gatId) throw new NotFoundException('مربی یافت نشد')
        const count = await this.prisma.coachAvailability.count({ where: { coachId: gatId.id } });
        if (count >= 7) throw new BadRequestException('حداکثر ۷ مورد (روزهای هفته) مجاز است');
        await this.prisma.coachAvailability.create({ data: { coachId: gatId.id, ...dto } });
        return { success: true };
    }

    async updateAvailable(id: string, dto: UpdateAvailabilityDto, coachId: string) {
        await this.checkMe(id, coachId);
        await this.prisma.coachAvailability.update({ where: { id }, data: { ...dto } });
        return { success: true };
    }

    async deleteAvailable(id: string, userId: string) {
        await this.checkMe(id, userId);
        await this.prisma.coachAvailability.delete({ where: { id } });
        return { success: true };
    }

    private async checkMe(id: string, userId?: string) {
        const gatCoach = await this.prisma.coach.findUnique({ where: { userId }, select: { id: true } })
        if (!gatCoach) throw new NotFoundException('مربی یافت نشد')
        const found = await this.prisma.coachAvailability.findFirst({
            where: { id, ...(gatCoach && { coachId: gatCoach.id }) },
        });
        if (!found) throw new NotFoundException('اطلاعات یافت نشد');
    }

    async getMyAvailable(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { coach: { select: { id: true } } } })
        if (!user?.coach?.id) throw new NotFoundException('دوباره وارد حساب خود شوید');
        return this.prisma.coachAvailability.findMany({ where: { coachId: user.coach.id } })
    }
}
