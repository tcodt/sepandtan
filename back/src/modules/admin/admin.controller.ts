import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
  ApiBearerAuth,
  ApiOkResponse,
} from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';

// Services
import { SpecialtyService } from './specialty.service.js';
import { EquipmentService } from './equipment.service.js';
import { ExerciseService } from './exercise.service.js';
import { FoodService } from './food.service.js';
import { MuscleGroupService } from './muscleGroup.service.js';
import { TrainingGoalService } from './trainingGoal.service.js';

// DTOs
import { CreateSpecialtyDto, SearchExerciseDto, SearchFoodDto } from './dto/admin.dto.js';
import { CreateEquipmentDto } from './dto/admin.dto.js';
import { CreateExerciseDto } from './dto/admin.dto.js';
import { CreateFoodDto } from './dto/admin.dto.js';
import { CreateMuscleGroupDto } from './dto/admin.dto.js';
import { CreateTrainingGoalDto } from './dto/admin.dto.js';
import { EquipmentEntity, ExerciseEntity, FoodEntity, MuscleGroupEntity, SpecialtyEntity, TrainingGoalEntity } from './entities/admin.entity.js';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AccessTokenGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class AdminController {
  constructor(
    private readonly specialtyService: SpecialtyService,
    private readonly equipmentService: EquipmentService,
    private readonly exerciseService: ExerciseService,
    private readonly foodService: FoodService,
    private readonly muscleGroupService: MuscleGroupService,
    private readonly trainingGoalService: TrainingGoalService,
  ) { }

  // ============================================================
  // Specialty
  // ============================================================
  @Get('specialty')
  @ApiOkResponse({ type: [SpecialtyEntity] })
  @ApiOperation({ summary: 'لیست تخصص (Admin)' })
  getSpecialty() {
    return this.specialtyService.getAll();
  }

  @Post('specialty')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'ایجاد تخصص (Admin)' })
  createSpecialty(@Body() dto: CreateSpecialtyDto) {
    return this.specialtyService.create(dto);
  }

  @Put('specialty/:id')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'ویرایش تخصص (Admin)' })
  updateSpecialty(@Param('id') id: string, @Body() dto: CreateSpecialtyDto) {
    return this.specialtyService.update(id, dto);
  }

  @Delete('specialty/:id')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'حذف تخصص (Admin)' })
  deleteSpecialty(@Param('id') id: string) {
    return this.specialtyService.delete(id);
  }

  // ============================================================
  // Equipment
  // ============================================================
  @Get('equipment')
  @ApiOkResponse({ type: [EquipmentEntity] })
  @ApiOperation({ summary: 'لیست تجهیزات (Admin)' })
  getEquipment(@Query() query: QueryDefaultDto) {
    return this.equipmentService.getAll(query);
  }

  @Post('equipment')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'ایجاد تجهیزات (Admin)' })
  createEquipment(@Body() dto: CreateEquipmentDto) {
    return this.equipmentService.create(dto);
  }

  @Put('equipment/:id')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'ویرایش تجهیزات (Admin)' })
  updateEquipment(@Param('id') id: string, @Body() dto: CreateEquipmentDto) {
    return this.equipmentService.update(id, dto);
  }

  @Delete('equipment/:id')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'حذف تجهیزات (Admin)' })
  deleteEquipment(@Param('id') id: string) {
    return this.equipmentService.delete(id);
  }

  // ============================================================
  // Exercise
  // ============================================================
  @Get('exercise')
  @ApiOkResponse({ type: [ExerciseEntity] })
  @ApiOperation({ summary: 'لیست تمرین (Admin)' })
  getAllAdmin(@Query() query: SearchExerciseDto) {
    return this.exerciseService.getAllAdmin(query);
  }

  @Post('exercise')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'ایجاد تمرین (Admin)' })
  createExercise(@Body() dto: CreateExerciseDto) {
    return this.exerciseService.create(dto);
  }

  @Put('exercise/:id')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'ویرایش تمرین (Admin)' })
  updateExercise(@Param('id') id: string, @Body() dto: CreateExerciseDto) {
    return this.exerciseService.update(id, dto);
  }

  @Delete('exercise/:id')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'حذف تمرین (Admin)' })
  deleteExercise(@Param('id') id: string) {
    return this.exerciseService.delete(id);
  }

  // ============================================================
  // Food
  // ============================================================

  @Get('food')
  @ApiOkResponse({ type: [FoodEntity] })
  @ApiOperation({ summary: 'لیست غذاها (Admin)' })
  getAllAdminFood(@Query() query: SearchFoodDto) {
    return this.foodService.getAllAdmin(query);
  }

  @Post('food')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'ایجاد غذا (Admin)' })
  createFood(@Body() dto: CreateFoodDto) {
    return this.foodService.create(dto);
  }

  @Put('food/:id')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'ویرایش غذا (Admin)' })
  updateFood(@Param('id') id: string, @Body() dto: CreateFoodDto) {
    return this.foodService.update(id, dto);
  }

  @Delete('food/:id')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'حذف غذا (Admin)' })
  deleteFood(@Param('id') id: string) {
    return this.foodService.delete(id);
  }

  // ============================================================
  // MuscleGroup
  // ============================================================
  @Get('muscle-group')
  @ApiOkResponse({ type: [MuscleGroupEntity] })
  @ApiOperation({ summary: 'لیست گروه عضلانی (Admin)' })
  getAllMuscleGroup(@Query() query: QueryDefaultDto, @Query('title') title: string) {
    return this.muscleGroupService.getAll(title, query);
  }

  @Get('muscle-group/:slug')
  @ApiOkResponse({ type: MuscleGroupEntity })
  @ApiOperation({ summary: 'دریافت تکی گروه عضلانی (Admin)' })
  getMuscleGroup(@Param('slug') slug: string) {
    return this.muscleGroupService.getOne(slug);
  }

  @Post('muscle-group')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'ایجاد گروه عضلانی (Admin)' })
  createMuscleGroup(@Body() dto: CreateMuscleGroupDto) {
    return this.muscleGroupService.create(dto);
  }

  @Put('muscle-group/:id')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'ویرایش گروه عضلانی (Admin)' })
  updateMuscleGroup(@Param('id') id: string, @Body() dto: CreateMuscleGroupDto) {
    return this.muscleGroupService.update(id, dto);
  }

  @Delete('muscle-group/:id')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'حذف گروه عضلانی (Admin)' })
  deleteMuscleGroup(@Param('id') id: string) {
    return this.muscleGroupService.delete(id);
  }

  // ============================================================
  // TrainingGoal
  // ============================================================
  @Get('training-goal')
  @ApiOkResponse({ type: [TrainingGoalEntity] })
  @ApiOperation({ summary: 'لیست هدف تمرینی (Admin)' })
  getTrainingGoal(@Query() query: QueryDefaultDto, @Query('title') title: string) {
    return this.trainingGoalService.getAll(title, query);
  }

  @Post('training-goal')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'ایجاد هدف تمرینی (Admin)' })
  createTrainingGoal(@Body() dto: CreateTrainingGoalDto) {
    return this.trainingGoalService.create(dto);
  }

  @Put('training-goal/:id')
  @ApiOperation({ summary: 'ویرایش هدف تمرینی (Admin)' })
  @ApiOkResponse({ example: { success: true } })
  updateTrainingGoal(@Param('id') id: string, @Body() dto: CreateTrainingGoalDto) {
    return this.trainingGoalService.update(id, dto);
  }

  @Delete('training-goal/:id')
  @ApiOkResponse({ example: { success: true } })
  @ApiOperation({ summary: 'حذف هدف تمرینی (Admin)' })
  deleteTrainingGoal(@Param('id') id: string) {
    return this.trainingGoalService.delete(id);
  }
}