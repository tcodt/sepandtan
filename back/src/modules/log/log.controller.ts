import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { UserLogService } from './user-log.service.js';
import {
  CreateUserLogDto, UpdateUserLogDto, UpdateCoachNoteDto,
  MonthlyStatsQueryDto, WeeklyStatsQueryDto, YearlyStatsQueryDto,
  LogRangeQueryDto,
} from './dto/user-log.dto.js';
import {
  UserLogEntity, UserLogSummaryEntity,
  MonthlyStatsResponseEntity, WeeklyStatsResponseEntity, YearlyStatsResponseEntity,
} from './entity/user-log.entity.js';

@ApiTags('Log')
@Controller('log')
@UseGuards(AccessTokenGuard)
export class LogController {
  constructor(private readonly userLogService: UserLogService) {}

  // ============ User ============

  @Post()
  @Roles('USER')
  @ApiOkResponse({ type: UserLogEntity })
  @ApiOperation({
    summary: 'ثبت لاگ روزانه (User)',
    description:
      'unique([userId, date]) → تکراری 409. unCompleted* = انجام‌نشده‌ها؛ done* = planned − unCompleted. ' +
      'با userPlanId، planned از snapshot (اولویت) یا قالب محاسبه می‌شود.',
  })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateUserLogDto) {
    return this.userLogService.create(userId, dto);
  }

  @Get()
  @Roles('USER')
  @ApiOkResponse({ type: PaginatedResponse(UserLogSummaryEntity, 'logs') })
  @ApiOperation({
    summary: 'لیست لاگ‌های من (User)',
    description: 'from/to اختیاری (حداکثر ۳۶۵ روز). sort: date_desc|date_asc|weight_*|done_*|calories_desc',
  })
  getMyLogs(@CurrentUser('id') userId: string, @Query() query: LogRangeQueryDto) {
    return this.userLogService.getMyLogs(userId, query);
  }

  // ---- Stats قبل از مسیرهای پارامتری ----

  @Get('stats/monthly')
  @Roles('USER')
  @ApiOkResponse({ type: MonthlyStatsResponseEntity })
  @ApiOperation({ summary: 'آمار ماهانه یک سال شمسی (User)' })
  getMonthlyStats(@CurrentUser('id') userId: string, @Query() query: MonthlyStatsQueryDto) {
    return this.userLogService.getMonthlyStats(userId, query.year);
  }

  @Get('stats/weekly')
  @Roles('USER')
  @ApiOkResponse({ type: WeeklyStatsResponseEntity })
  @ApiOperation({ summary: 'آمار هفتگی در بازه (User) — حداکثر ۳۶۵ روز' })
  getWeeklyStats(@CurrentUser('id') userId: string, @Query() query: WeeklyStatsQueryDto) {
    return this.userLogService.getWeeklyStats(userId, query.from, query.to);
  }

  @Get('stats/yearly')
  @Roles('USER')
  @ApiOkResponse({ type: YearlyStatsResponseEntity })
  @ApiOperation({ summary: 'آمار یک سال شمسی (User) — فقط همان سال' })
  getYearlyStats(@CurrentUser('id') userId: string, @Query() query: YearlyStatsQueryDto) {
    return this.userLogService.getYearlyStats(userId, query.year);
  }

  @Get('date/:date')
  @Roles('USER')
  @ApiOkResponse({ type: UserLogEntity })
  @ApiOperation({ summary: 'لاگ یک تاریخ (User)' })
  getByDate(@CurrentUser('id') userId: string, @Param('date') date: string) {
    return this.userLogService.getByDate(userId, date);
  }

  @Get('plan/:planId')
  @Roles('USER')
  @ApiOkResponse({ type: PaginatedResponse(UserLogEntity, 'logs') })
  @ApiOperation({ summary: 'لاگ‌های یک برنامه (User)' })
  getByPlan(
    @CurrentUser('id') userId: string,
    @Param('planId') planId: string,
    @Query() query: LogRangeQueryDto,
  ) {
    return this.userLogService.getByPlan(userId, planId, query);
  }

  @Put(':id')
  @Roles('USER')
  @ApiOkResponse({ type: UserLogEntity })
  @ApiOperation({ summary: 'ویرایش لاگ (User) — date/userPlanId ثابت' })
  update(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() dto: UpdateUserLogDto) {
    return this.userLogService.update(userId, id, dto);
  }

  @Delete(':id')
  @Roles('USER')
  @ApiOperation({ summary: 'حذف لاگ (User)' })
  delete(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.userLogService.delete(userId, id);
  }

  // ============ Coach ============

  @Get('coach/user/:userId')
  @Roles('COACH')
  @ApiOkResponse({ type: PaginatedResponse(UserLogSummaryEntity, 'logs') })
  @ApiOperation({
    summary: 'لاگ‌های شاگرد (Coach)',
    description:
      'from/to حداکثر ۳۶۵ روز. sortهای مختلف. فقط اگر حداقل یک UserPlan با این مربی داشته باشد.',
  })
  getCoachUserLogs(
    @CurrentUser('id') coachUserId: string,
    @Param('userId') userId: string,
    @Query() query: LogRangeQueryDto,
  ) {
    return this.userLogService.getCoachUserLogs(coachUserId, userId, query);
  }

  @Get('coach/user/:userId/stats/monthly')
  @Roles('COACH')
  @ApiOkResponse({ type: MonthlyStatsResponseEntity })
  @ApiOperation({ summary: 'آمار ماهانه شاگرد (Coach)' })
  getCoachMonthly(
    @CurrentUser('id') coachUserId: string,
    @Param('userId') userId: string,
    @Query() query: MonthlyStatsQueryDto,
  ) {
    return this.userLogService.getCoachMonthlyStats(coachUserId, userId, query.year);
  }

  @Get('coach/user/:userId/stats/weekly')
  @Roles('COACH')
  @ApiOkResponse({ type: WeeklyStatsResponseEntity })
  @ApiOperation({ summary: 'آمار هفتگی شاگرد (Coach) — بازه ≤ ۳۶۵ روز' })
  getCoachWeekly(
    @CurrentUser('id') coachUserId: string,
    @Param('userId') userId: string,
    @Query() query: WeeklyStatsQueryDto,
  ) {
    return this.userLogService.getCoachWeeklyStats(coachUserId, userId, query.from, query.to);
  }

  @Get('coach/user/:userId/stats/yearly')
  @Roles('COACH')
  @ApiOkResponse({ type: YearlyStatsResponseEntity })
  @ApiOperation({ summary: 'آمار سالانه شاگرد (Coach) — یک سال شمسی' })
  getCoachYearly(
    @CurrentUser('id') coachUserId: string,
    @Param('userId') userId: string,
    @Query() query: YearlyStatsQueryDto,
  ) {
    return this.userLogService.getCoachYearlyStats(coachUserId, userId, query.year);
  }

  @Patch(':id/coach-note')
  @Roles('COACH')
  @ApiOperation({ summary: 'یادداشت مربی روی لاگ' })
  updateCoachNote(
    @CurrentUser('id') coachUserId: string,
    @Param('id') logId: string,
    @Body() dto: UpdateCoachNoteDto,
  ) {
    return this.userLogService.updateCoachNote(coachUserId, logId, dto.coachNote);
  }
}
