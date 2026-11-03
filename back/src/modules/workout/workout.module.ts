import { Module } from '@nestjs/common';
import { WorkoutController } from './workout.controller.js';
import { WorkoutService } from './workout.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [WorkoutController],
  providers: [WorkoutService, PrismaService],
  exports: [WorkoutService],
})
export class WorkoutModule { }