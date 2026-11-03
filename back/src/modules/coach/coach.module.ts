import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CoachService } from './coach.service.js';
import { CoachsController } from './coach.controller.js';
import { CertificationService } from './certification.service.js';
import { AvailableService } from './available.service.js';
import { ReviewCoachService } from './review.service.js';
import { AchievementService } from './achievement.service.js';
import { SpecialtyService } from '../admin/specialty.service.js';
import { EquipmentService } from '../admin/equipment.service.js';
import { ExerciseService } from '../admin/exercise.service.js';
import { FoodService } from '../admin/food.service.js';
import { MuscleGroupService } from '../admin/muscleGroup.service.js';
import { TrainingGoalService } from '../admin/trainingGoal.service.js';
import { AdminsModule } from '../admin/admin.module.js';

@Module({
  imports: [AuthModule, AdminsModule],
  controllers: [CoachsController],
  providers: [
    CoachService,
    CertificationService,
    AvailableService,
    AchievementService,
    ReviewCoachService
  ],
  exports: [
    CoachService,
    CertificationService,
    AvailableService,
    AchievementService,
    ReviewCoachService
  ],
})
export class CoachModule { }
