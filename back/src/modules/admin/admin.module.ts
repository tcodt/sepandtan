import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AdminController } from './admin.controller.js';
import { EquipmentService } from './equipment.service.js';
import { ExerciseService } from './exercise.service.js';
import { FoodService } from './food.service.js';
import { MuscleGroupService } from './muscleGroup.service.js';
import { SpecialtyService } from './specialty.service.js';
import { TrainingGoalService } from './trainingGoal.service.js';


@Module({
    imports: [AuthModule],
    controllers: [AdminController],
    providers: [
        EquipmentService,
        ExerciseService,
        FoodService,
        MuscleGroupService,
        SpecialtyService,
        TrainingGoalService
    ],
    exports: [
        EquipmentService,
        ExerciseService,
        FoodService,
        MuscleGroupService,
        SpecialtyService,
        TrainingGoalService
    ],
})
export class AdminsModule { }
