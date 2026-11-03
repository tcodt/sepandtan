import { Module } from '@nestjs/common';
import { LogController } from './log.controller.js';
import { UserLogService } from './user-log.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [LogController],
  providers: [
    UserLogService,
    PrismaService,
    // اینجا سرویس‌های دیگر لاگ را اضافه کنید:
    // WeightLogService,
    // NutritionLogService,
    // ...
  ],
  exports: [UserLogService],
})
export class LogModule { }