/**
 * ReportModule - ماژول مدیریت گزارش‌ها
 */
import { Module } from '@nestjs/common';
import { ReportController } from './report.controller.js';
import { ReportService } from './report.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule { }