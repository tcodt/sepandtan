import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, UseGuards, Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { UserPlanService } from './user-plan.service.js';
import {
  CreatePlanRequestDto, UpdatePlanRequestStatusDto,
  CreateUserPlanDto, UpdateUserPlanDto, CustomizeSnapshotDto,
} from './dto/user-plan.dto.js';
import { PlanRequestEntity, UserPlanEntity } from './entity/user-plan.entity.js';

@ApiTags('UserPlan')
@Controller('user-plan')
@UseGuards(AccessTokenGuard)
export class UserPlanController {
  constructor(private readonly service: UserPlanService) {}

  // ============ PlanRequest ============

  @Post('request')
  @Roles('USER')
  @ApiOperation({ summary: 'درخواست برنامه از مربی (User)' })
  createRequest(@CurrentUser('id') userId: string, @Body() dto: CreatePlanRequestDto) {
    return this.service.createRequest(userId, dto);
  }

  @Get('request/my')
  @Roles('USER')
  @ApiOkResponse({ type: PaginatedResponse(PlanRequestEntity, 'requests') })
  @ApiOperation({ summary: 'لیست درخواست‌های من (User)' })
  getMyRequests(@CurrentUser('id') userId: string, @Query() query: QueryDefaultDto) {
    return this.service.getMyRequests(userId, query);
  }

  @Get('request/coach')
  @Roles('COACH')
  @ApiOkResponse({ type: PaginatedResponse(PlanRequestEntity, 'requests') })
  @ApiOperation({ summary: 'لیست درخواست‌های دریافتی (Coach)' })
  getCoachRequests(@CurrentUser('id') userId: string, @Query() query: QueryDefaultDto) {
    return this.service.getCoachRequests(userId, query);
  }

  @Patch('request/:id/status')
  @Roles('COACH')
  @ApiOperation({ summary: 'تغییر وضعیت درخواست (Coach)', description: 'فقط برای PENDING — ACCEPTED/REJECTED' })
  updateRequestStatus(
    @CurrentUser('id') userId: string,
    @Param('id') requestId: string,
    @Body() dto: UpdatePlanRequestStatusDto,
  ) {
    return this.service.updateRequestStatus(userId, requestId, dto);
  }

  // ============ UserPlan ============

  @Get()
  @ApiOkResponse({ type: PaginatedResponse(UserPlanEntity, 'userPlans') })
  @ApiOperation({ summary: 'لیست برنامه‌های من (User)' })
  getMyPlans(@CurrentUser('id') userId: string, @Query() query: QueryDefaultDto) {
    return this.service.getMyPlans(userId, query);
  }

  @Get(':id')
  @ApiOkResponse({ type: UserPlanEntity })
  @ApiOperation({ summary: 'جزئیات برنامه (User/Admin)' })
  getPlan(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: string,
    @Param('id') id: string,
  ) {
    return this.service.getPlan(userId, id, role);
  }

  @Post()
  @Roles('USER')
  @ApiOperation({ summary: 'ایجاد برنامه (User)', description: 'حداقل یکی از workoutPlanId/dietPlanId/requestId الزامی' })
  createPlan(@CurrentUser('id') userId: string, @Body() dto: CreateUserPlanDto) {
    return this.service.createPlan(userId, dto);
  }

  @Put(':id')
  @Roles('USER')
  @ApiOperation({ summary: 'ویرایش برنامه (User)' })
  updatePlan(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateUserPlanDto) {
    return this.service.updatePlan(userId, id, dto);
  }

  @Patch(':id/activate')
  @Roles('USER')
  @ApiOperation({ summary: 'فعال‌سازی برنامه (User)', description: 'برنامه‌های ACTIVE قبلی COMPLETED می‌شوند' })
  activatePlan(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.activatePlan(userId, id);
  }

  @Patch(':id/complete')
  @Roles('USER')
  @ApiOperation({ summary: 'تکمیل برنامه (User)' })
  completePlan(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.completePlan(userId, id);
  }

  @Patch(':id/customize')
  @Roles('USER')
  @ApiOperation({ summary: 'شخصی‌سازی snapshot (User/Coach)' })
  customizePlan(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: CustomizeSnapshotDto) {
    return this.service.customizePlan(userId, id, dto);
  }

  @Delete(':id')
  @Roles('USER')
  @ApiOperation({ summary: 'حذف برنامه (User)' })
  deletePlan(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.service.deletePlan(userId, id);
  }
}