import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateCertificationDto, UpdateCertificationDto } from './dto/coach.dto.js';
import { ConfigService } from '@nestjs/config';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import pagination from '../../common/utils/pagination.js';
import { RolePerson } from '../../generated/prisma/enums.js';

@Injectable()
export class CertificationService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    private async checkMe(id: string, userId: string) {
        const coachId = await this.getCoachId(userId)
        const found = await this.prisma.certification.findFirst({
            where: { id, ...(coachId && { coachId }) },
            include: { coach: { select: { userId: true } } }
        });
        if (!found) throw new NotFoundException('مدرک یافت نشد');
        return coachId;
    }

    private async getCoachId(userId: string) {
        const getCoach = await this.prisma.coach.findUnique({ where: { userId }, select: { id: true } })
        if (!getCoach) throw new NotFoundException('مربی یافت نشد')
        return getCoach.id
    }

    async createCertification(dto: CreateCertificationDto, userId: string) {
        const coachId = await this.getCoachId(userId)
        const data = await this.prisma.certification.count({ where: { coachId: coachId } })
        if (data >= 10) throw new BadRequestException('حداکثر مجاز به ساخت  10 مورد است');
        await this.prisma.$transaction(async (tx) => {
            if (dto.isPrimary) {
                await tx.certification.updateMany({
                    where: { coachId: coachId, isPrimary: true },
                    data: { isPrimary: false },
                });
            }
            await tx.certification.create({
                data: {
                    coachId: coachId,
                    type: dto.type,
                    title: dto.title,
                    field: dto.field,
                    level: dto.level,
                    issuer: dto.issuer,
                    documentUrl: dto.documentUrl,
                    expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                    isPrimary: dto.isPrimary ?? false,
                },
            });
        });
        return { success: true };
    }

    async updateCertification(id: string, dto: UpdateCertificationDto, userId: string) {
        const coachId = await this.checkMe(id, userId)
        const data: any = { ...dto };
        if (dto?.expiresAt) data.expiresAt = new Date(dto?.expiresAt);
        await this.prisma.$transaction(async (tx) => {
            if (dto.isPrimary) {
                await tx.certification.updateMany({
                    where: { coachId: coachId, isPrimary: true, id: { not: id } },
                    data: { isPrimary: false },
                });
            }
            await tx.certification.update({ where: { id }, data });
        });
        return { success: true }
    }

    async changeVerify(id: string) {
        const data = await this.prisma.certification.findUnique({ where: { id }, select: { isVerified: true } })
        if (!data) throw new NotFoundException(`مدرک مورد نظر یافت نشد`)
        const newData = await this.prisma.certification.update({ where: { id }, data: { isVerified: !data.isVerified } })
        return {
            success: true,
            messsage: newData.isVerified ? 'مدرک فعال شد' : 'مدرک غیر فعال شد'
        }
    }

    async getMyCertification(userId: string) {
        const data = await this.prisma.user.findUnique({ where: { id: userId }, select: { coach: { select: { id: true } } } })
        if (!data?.coach?.id) throw new NotFoundException('دوباره وارد حساب خود شوید');
        return this.prisma.certification.findMany({
            where: { coachId: data.coach.id },
            orderBy: { createdAt: 'desc' }
        })
    }

    async getAllCertificationCoach(coachId: string) {
        return this.prisma.certification.findMany({
            where: { coachId, isVerified: true },
            orderBy: { createdAt: 'desc' }
        })
    }

    async getAllAdmin(coachId: string | undefined | null, query: QueryDefaultDto) {
        const { limit, order, page = 1 } = query
        const limitPage = Number(limit) || Number(this.configService.get('limit.coach'))
        const skip = (page - 1) * limitPage;
        const where = { ...(coachId && { coachId }) }
        const [data, count] = await Promise.all([
            this.prisma.certification.findMany({
                where,
                take: limitPage,
                skip,
                orderBy: { createdAt: order || 'desc' }
            }),
            this.prisma.certification.count({ where })
        ])
        return {
            certification: data,
            pagination: pagination(count, page, limitPage),
        }
    }

    async deleteCertification(id: string, userId: string) {
        await this.checkMe(id, userId)
        await this.prisma.certification.delete({ where: { id } })
        return { success: true }
    }
}