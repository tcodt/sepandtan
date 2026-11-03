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
import { DietService } from './diet.service.js';
import {
  CreateDietPlanDto, UpdateDietPlanDto,
  CreateDietDayDto, UpdateDietDayDto,
  CreateDietMealDto, UpdateDietMealDto,
  CreateDietMealItemDto, UpdateDietMealItemDto,
} from './dto/diet.dto.js';
import {
  DietPlanEntity, DietPlanSummaryEntity,
  DietDayEntity, DietMealEntity, DietMealItemEntity,
} from './entity/diet.entity.js';

@ApiTags('Diet')
@Controller('diet')
export class DietController {
  constructor(private readonly dietService: DietService) {}

  // ============ Public: Plan ============

  @Get('plan')
  @ApiOkResponse({ type: PaginatedResponse(DietPlanSummaryEntity, 'dietPlans') })
  @ApiOperation({ summary: 'لیست برنامه‌های غذایی منتشرشده (Public)' })
  getPlans(@Query() query: QueryDefaultDto) {
    return this.dietService.getPlans(query, true);
  }

  @Get('plan/:id')
  @ApiOkResponse({ type: DietPlanEntity })
  @ApiOperation({ summary: 'جزئیات یک برنامه غذایی (Public)' })
  getPlan(@Param('id') id: string) {
    return this.dietService.getPlan(id);
  }

  // ============ Coach: Plan CRUD ============

  @Get('plan/my')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: PaginatedResponse(DietPlanSummaryEntity, 'dietPlans') })
  @ApiOperation({ summary: 'لیست برنامه‌های غذایی من (Coach)' })
  getMyPlans(@CurrentUser('id') userId: string, @Query() query: QueryDefaultDto) {
    return this.dietService.getMyPlans(userId, query);
  }

  @Post('plan')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: DietPlanEntity })
  @ApiOperation({ summary: 'ایجاد برنامه غذایی (Coach)' })
  createPlan(@CurrentUser('id') userId: string, @Body() dto: CreateDietPlanDto) {
    return this.dietService.createPlan(userId, dto);
  }

  @Put('plan/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'ویرایش برنامه غذایی (Coach)' })
  updatePlan(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateDietPlanDto) {
    return this.dietService.updatePlan(userId, id, dto);
  }

  @Patch('plan/:id/publish')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'انتشار / لغو انتشار برنامه (Coach)' })
  togglePublish(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.dietService.togglePublish(userId, id);
  }

  @Delete('plan/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'حذف برنامه غذایی (Coach)' })
  deletePlan(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.dietService.deletePlan(userId, id);
  }

  // ============ Coach: Day ============

  @Post('plan/:planId/day')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: DietDayEntity })
  @ApiOperation({ summary: 'افزودن روز به برنامه (Coach)' })
  addDay(@CurrentUser('id') userId: string, @Param('planId') planId: string, @Body() dto: CreateDietDayDto) {
    return this.dietService.addDay(userId, planId, dto);
  }

  @Put('day/:dayId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'ویرایش روز (Coach)' })
  updateDay(@CurrentUser('id') userId: string, @Param('dayId') dayId: string, @Body() dto: UpdateDietDayDto) {
    return this.dietService.updateDay(userId, dayId, dto);
  }

  @Delete('day/:dayId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'حذف روز (Coach)' })
  deleteDay(@CurrentUser('id') userId: string, @Param('dayId') dayId: string) {
    return this.dietService.deleteDay(userId, dayId);
  }

  // ============ Coach: Meal ============

  @Post('day/:dayId/meal')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: DietMealEntity })
  @ApiOperation({ summary: 'افزودن وعده به روز (Coach)' })
  addMeal(@CurrentUser('id') userId: string, @Param('dayId') dayId: string, @Body() dto: CreateDietMealDto) {
    return this.dietService.addMeal(userId, dayId, dto);
  }

  @Put('meal/:mealId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'ویرایش وعده (Coach)' })
  updateMeal(@CurrentUser('id') userId: string, @Param('mealId') mealId: string, @Body() dto: UpdateDietMealDto) {
    return this.dietService.updateMeal(userId, mealId, dto);
  }

  @Delete('meal/:mealId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'حذف وعده (Coach)' })
  deleteMeal(@CurrentUser('id') userId: string, @Param('mealId') mealId: string) {
    return this.dietService.deleteMeal(userId, mealId);
  }

  // ============ Coach: Meal Item ============

  @Post('meal/:mealId/item')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: DietMealItemEntity })
  @ApiOperation({ summary: 'افزودن غذا به وعده (Coach)' })
  addMealItem(@CurrentUser('id') userId: string, @Param('mealId') mealId: string, @Body() dto: CreateDietMealItemDto) {
    return this.dietService.addMealItem(userId, mealId, dto);
  }

  @Put('item/:itemId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'ویرایش آیتم غذا (Coach)' })
  updateMealItem(@CurrentUser('id') userId: string, @Param('itemId') itemId: string, @Body() dto: UpdateDietMealItemDto) {
    return this.dietService.updateMealItem(userId, itemId, dto);
  }

  @Delete('item/:itemId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({ summary: 'حذف آیتم غذا (Coach)' })
  deleteMealItem(@CurrentUser('id') userId: string, @Param('itemId') itemId: string) {
    return this.dietService.deleteMealItem(userId, itemId);
  }
}