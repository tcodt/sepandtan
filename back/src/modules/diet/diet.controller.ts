import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import { DietService } from './diet.service.js';
import {
  CreateDietPlanDto, UpdateDietPlanDto,
  CreateDietPhaseDto, UpdateDietPhaseDto,
  CreateDietDayDto, UpdateDietDayDto,
  CreateDietMealDto, UpdateDietMealDto,
  CreateDietMealItemDto, UpdateDietMealItemDto,
} from './dto/diet.dto.js';

@ApiTags('Diet')
@Controller('diet')
export class DietController {
  constructor(private readonly dietService: DietService) {}

  @Get('plan')
  @ApiOperation({ summary: 'لیست برنامه‌های غذایی منتشرشده' })
  getPlans(@Query() query: QueryDefaultDto) {
    return this.dietService.getPlans(query);
  }

  @Get('plan/my')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  getMyPlans(@CurrentUser('id') userId: string, @Query() query: QueryDefaultDto) {
    return this.dietService.getMyPlans(userId, query);
  }

  @Get('plan/:id')
  getPlan(@Param('id') id: string) {
    return this.dietService.getPlan(id);
  }

  @Post('plan')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  createPlan(@CurrentUser('id') userId: string, @Body() dto: CreateDietPlanDto) {
    return this.dietService.createPlan(userId, dto);
  }

  @Put('plan/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  updatePlan(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDietPlanDto,
  ) {
    return this.dietService.updatePlan(userId, id, dto);
  }

  @Patch('plan/:id/publish')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  togglePublish(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.dietService.togglePublish(userId, id);
  }

  @Delete('plan/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  deletePlan(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.dietService.deletePlan(userId, id);
  }

  // Phase
  @Post('plan/:planId/phase')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  addPhase(
    @CurrentUser('id') userId: string,
    @Param('planId') planId: string,
    @Body() dto: CreateDietPhaseDto,
  ) {
    return this.dietService.addPhase(userId, planId, dto);
  }

  @Put('phase/:phaseId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  updatePhase(
    @CurrentUser('id') userId: string,
    @Param('phaseId') phaseId: string,
    @Body() dto: UpdateDietPhaseDto,
  ) {
    return this.dietService.updatePhase(userId, phaseId, dto);
  }

  @Delete('phase/:phaseId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  deletePhase(@CurrentUser('id') userId: string, @Param('phaseId') phaseId: string) {
    return this.dietService.deletePhase(userId, phaseId);
  }

  // Day
  @Post('plan/:planId/day')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  addDay(
    @CurrentUser('id') userId: string,
    @Param('planId') planId: string,
    @Body() dto: CreateDietDayDto,
  ) {
    return this.dietService.addDay(userId, planId, dto);
  }

  @Put('day/:dayId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  updateDay(
    @CurrentUser('id') userId: string,
    @Param('dayId') dayId: string,
    @Body() dto: UpdateDietDayDto,
  ) {
    return this.dietService.updateDay(userId, dayId, dto);
  }

  @Delete('day/:dayId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  deleteDay(@CurrentUser('id') userId: string, @Param('dayId') dayId: string) {
    return this.dietService.deleteDay(userId, dayId);
  }

  // Meal
  @Post('day/:dayId/meal')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  addMeal(
    @CurrentUser('id') userId: string,
    @Param('dayId') dayId: string,
    @Body() dto: CreateDietMealDto,
  ) {
    return this.dietService.addMeal(userId, dayId, dto);
  }

  @Put('meal/:mealId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  updateMeal(
    @CurrentUser('id') userId: string,
    @Param('mealId') mealId: string,
    @Body() dto: UpdateDietMealDto,
  ) {
    return this.dietService.updateMeal(userId, mealId, dto);
  }

  @Delete('meal/:mealId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  deleteMeal(@CurrentUser('id') userId: string, @Param('mealId') mealId: string) {
    return this.dietService.deleteMeal(userId, mealId);
  }

  // Item
  @Post('meal/:mealId/item')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  addMealItem(
    @CurrentUser('id') userId: string,
    @Param('mealId') mealId: string,
    @Body() dto: CreateDietMealItemDto,
  ) {
    return this.dietService.addMealItem(userId, mealId, dto);
  }

  @Put('item/:itemId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  updateMealItem(
    @CurrentUser('id') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateDietMealItemDto,
  ) {
    return this.dietService.updateMealItem(userId, itemId, dto);
  }

  @Delete('item/:itemId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  deleteMealItem(@CurrentUser('id') userId: string, @Param('itemId') itemId: string) {
    return this.dietService.deleteMealItem(userId, itemId);
  }
}