import { Module } from '@nestjs/common';
import { PlanRequestController } from './plan-request.controller.js';
import { UserPlanController } from './user-plan.controller.js';
import { PlanRequestService } from './plan-request.service.js';
import { AuthModule } from '../auth/auth.module.js';
import { UserPlanService } from './user-plan.service.js';
@Module({
  imports: [AuthModule],
  controllers: [PlanRequestController, UserPlanController],
  providers: [PlanRequestService, UserPlanService],
  exports: [PlanRequestService, UserPlanService],
})
export class PlanRequestModule { }