import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAvailabilityDto, UpdateAvailabilityDto } from './dto/coach.dto.js';

@Injectable()
export class AvailableService {
    constructor(private readonly prisma: PrismaService) { }

    async createAvailable(coachId: string, dto: CreateAvailabilityDto) {
        const count = await this.prisma.coachAvailability.count({ where: { coachId } });
        if (count >= 7) throw new BadRequestException('حداکثر ۷ مورد (روزهای هفته) مجاز است');
        await this.prisma.coachAvailability.create({ data: { coachId, ...dto } });
        return { success: true };
    }

    async updateAvailable(id: string, dto: UpdateAvailabilityDto, coachId: string) {
        await this.checkMe(id, coachId);
        await this.prisma.coachAvailability.update({ where: { id }, data: { ...dto } });
        return { success: true };
    }

    async deleteAvailable(id: string, coachId: string) {
        await this.checkMe(id, coachId);
        await this.prisma.coachAvailability.delete({ where: { id } });
        return { success: true };
    }

    private async checkMe(id: string, coachId?: string) {
        const found = await this.prisma.coachAvailability.findFirst({
            where: { id, ...(coachId && { coachId }) },
        });
        if (!found) throw new NotFoundException('اطلاعات یافت نشد');
    }

    async getMyAvailable(userId: string) {
        const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { coach: { select: { id: true } } } })
        if (!user?.coach?.id) throw new NotFoundException('دوباره وارد حساب خود شوید');
        return this.prisma.coachAvailability.findMany({ where: { coachId: user.coach.id } })
    }
}
