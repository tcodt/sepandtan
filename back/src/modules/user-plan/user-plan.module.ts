import { Module } from '@nestjs/common';
import { UserPlanController } from './user-plan.controller.js';
import { UserPlanService } from './user-plan.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [UserPlanController],
  providers: [UserPlanService, PrismaService],
  exports: [UserPlanService],
})
export class UserPlanModule { }