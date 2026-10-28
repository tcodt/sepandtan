/**
 * ReportsController - کنترلر مدیریت گزارش‌ها
 */
import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, BadRequestException, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportService } from './report.service.js';
import { CreateReportDto, UpdateReportDto, QueryReportsDto } from './dto/report.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ReportsStatus } from '../../generated/prisma/enums.js';
;

@ApiTags('Reports')
@Controller('reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) { }

  /**
   * ایجاد گزارش جدید
   */
  @UseGuards(AccessTokenGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ایجاد گزارش جدید' })
  async create(@Body() dto: CreateReportDto) {
    return this.reportService.create(dto);
  }

  /**
   * GetAll گزارش‌ها (ادمین view)
   */
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get('admin/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تمام گزارش‌ها (ادمین)' })
  async getAllReports(
    @Query() query: QueryReportsDto,
  ) {
    return this.reportService.getAllReports(query);
  }

  /**
   * Get single report by ID
   */
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'جزئیات گزارش' })
  async findOne(@Param('id') id: string) {
    return this.reportService.findOne(id);
  }

  /**
   * Update report status (ادمین)
   */
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Patch(':id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تغییر وضعیت گزارش' })
  async updateStatus(@Param('id') id: string, @Body('status') status: ReportsStatus) {
    return this.reportService.update(id, status);
  }

  /**
   * آمار گزارش‌ها برای ادمین
   */
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get('admin/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'آمار گزارش‌ها (ادمین)' })
  async getStats() {
    return this.reportService.getStats();
  }

  /**
 * آمار تیکت‌ها برای ادمین
 */
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف تیکت‌ها (ادمین)' })
  async deleteTicket(@Param('id') id: string) {
    return this.reportService.deleteReport(id);
  }
}