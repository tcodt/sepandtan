/**
 * ReportService - مدیریت گزارش‌ها
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateReportDto, UpdateReportDto, QueryReportsDto } from './dto/report.dto.js';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import pagination from '../../common/utils/pagination.js';
import { ReportsStatus } from '../../generated/prisma/enums.js';

@Injectable()
export class ReportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) { }

  /**
   * ایجاد گزارش جدید
   */
  async create(dto: CreateReportDto) {
    return this.prisma.reports.create({
      data: {
        title: dto.title,
        orderCode: dto.orderCode,
        nameSeller: dto.nameSeller || '',
        content: dto.content,
        ...(dto.images?.length && {
          images: {
            connect: dto.images.map((i) => ({ url: i }))
          }
        })
      },
    });
  }

  /**
   * GetAll گزارش‌ها (ادمین view)
   */
  async getAllReports(query: QueryReportsDto) {
    const { limit = 10, order, page = 1, status, search } = query
    const limitPage = Number(limit) || Number(this.configService.get('limit.report'))
    const skip = (page - 1) * limitPage;
    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (search) where.orderCode = { contains: search, mode: 'insensitive' };
    const [reports, total] = await Promise.all([
      this.prisma.reports.findMany({
        where,
        include: { images: true },
        skip, take: limitPage, orderBy: { createdAt: order },
      }),
      this.prisma.reports.count({ where }),
    ]);

    return {
      reports,
      pagination: pagination(total, page, limitPage),
    };
  }

  /**
   * Get single report by ID
   */
  async findOne(id: string) {
    const report = await this.prisma.reports.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!report) throw new NotFoundException('گوش یافت نشد');
    return report;
  }

  /**
   * Update report status
   */
  async update(id: string, status: ReportsStatus) {
    const report = await this.prisma.reports.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('گوش یافت نشد');

    return this.prisma.reports.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Statistics for admin
   */
  async getStats() {
    const total = await this.prisma.reports.count();
    const pending = await this.prisma.reports.count({ where: { status: 'PENDING' } });
    const resolved = await this.prisma.reports.count({ where: { status: 'RESOLVED' } });
    const closed = await this.prisma.reports.count({ where: { status: 'CLOSED' } });

    return { total, pending, resolved, closed };
  }

  async deleteReport(id: string) {
    await this.prisma.reports.delete({ where: { id } })
    return { success: true }
  }
}