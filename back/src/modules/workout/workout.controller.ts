import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param,
  UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { WorkoutService } from './workout.service.js';
import {
  CreateWorkoutPlanDto, UpdateWorkoutPlanDto,
  CreateWorkoutDayDto, UpdateWorkoutDayDto,
  CreateWorkoutExerciseDto, UpdateWorkoutExerciseDto,
} from './dto/workout.dto.js';
import {
  WorkoutPlanEntity, WorkoutPlanSummaryEntity,
  WorkoutDayEntity, WorkoutDayExerciseEntity,
} from './entity/workout.entity.js';

@ApiTags('Workout')
@Controller('workout')
export class WorkoutController {
  constructor(private readonly workoutService: WorkoutService) {}

  // ============ Public ============

  @Get('plan')
  @ApiOkResponse({ type: PaginatedResponse(WorkoutPlanSummaryEntity, 'workoutPlans') })
  @ApiOperation({ summary: 'لیست برنامه‌های تمرینی منتشرشده (Public)', description: 'مرتب بر اساس avgRating' })
  getPlans(@Query() query: QueryDefaultDto) {
    return this.workoutService.getPlans(query);
  }

  @Get('plan/:id')
  @ApiOkResponse({ type: WorkoutPlanEntity })
  @ApiOperation({ summary: 'جزئیات برنامه تمرینی (Public)', description: 'شامل روزها، حرکات و اطلاعات حرکت' })
  getPlan(@Param('id') id: string) {
    return this.workoutService.getPlan(id);
  }

  // ============ Coach: Plan ============

  @Get('plan/my')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: PaginatedResponse(WorkoutPlanSummaryEntity, 'workoutPlans') })
  @ApiOperation({ summary: 'لیست برنامه‌های من (Coach)' })
  getMyPlans(@CurrentUser('id') userId: string, @Query() query: QueryDefaultDto) {
    return this.workoutService.getMyPlans(userId, query);
  }

  @Post('plan')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: WorkoutPlanEntity })
  @ApiOperation({ summary: 'ایجاد برنامه تمرینی (Coach)' })
  createPlan(@CurrentUser('id') userId: string, @Body() dto: CreateWorkoutPlanDto) {
    return this.workoutService.createPlan(userId, dto);
  }

  @Put('plan/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'ویرایش برنامه تمرینی (Coach)' })
  updatePlan(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateWorkoutPlanDto) {
    return this.workoutService.updatePlan(userId, id, dto);
  }

  @Patch('plan/:id/publish')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'انتشار / لغو انتشار برنامه (Coach)' })
  togglePublish(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.workoutService.togglePublish(userId, id);
  }

  @Delete('plan/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'حذف برنامه تمرینی (Coach)', description: 'روزها و حرکات نیز حذف می‌شوند (Cascade)' })
  deletePlan(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.workoutService.deletePlan(userId, id);
  }

  // ============ Coach: Day ============

  @Post('plan/:planId/day')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: WorkoutDayEntity })
  @ApiOperation({ summary: 'افزودن روز به برنامه (Coach)', description: 'dayIndex تکراری → 409' })
  addDay(@CurrentUser('id') userId: string, @Param('planId') planId: string, @Body() dto: CreateWorkoutDayDto) {
    return this.workoutService.addDay(userId, planId, dto);
  }

  @Put('day/:dayId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'ویرایش روز (Coach)' })
  updateDay(@CurrentUser('id') userId: string, @Param('dayId') dayId: string, @Body() dto: UpdateWorkoutDayDto) {
    return this.workoutService.updateDay(userId, dayId, dto);
  }

  @Delete('day/:dayId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'حذف روز (Coach)' })
  deleteDay(@CurrentUser('id') userId: string, @Param('dayId') dayId: string) {
    return this.workoutService.deleteDay(userId, dayId);
  }

  // ============ Coach: Exercise Item ============

  @Post('day/:dayId/exercise')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: WorkoutDayExerciseEntity })
  @ApiOperation({ summary: 'افزودن حرکت به روز (Coach)', description: 'exerciseId باید فعال باشد' })
  addExercise(@CurrentUser('id') userId: string, @Param('dayId') dayId: string, @Body() dto: CreateWorkoutExerciseDto) {
    return this.workoutService.addExercise(userId, dayId, dto);
  }

  @Put('exercise/:itemId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'ویرایش حرکت در روز (Coach)' })
  updateExercise(@CurrentUser('id') userId: string, @Param('itemId') itemId: string, @Body() dto: UpdateWorkoutExerciseDto) {
    return this.workoutService.updateExercise(userId, itemId, dto);
  }

  @Delete('exercise/:itemId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'حذف حرکت از روز (Coach)' })
  deleteExercise(@CurrentUser('id') userId: string, @Param('itemId') itemId: string) {
    return this.workoutService.deleteExercise(userId, itemId);
  }
}