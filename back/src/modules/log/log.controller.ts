import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { UserLogService } from './user-log.service.js';
import {
  CreateUserLogDto, UpdateUserLogDto, UpdateCoachNoteDto,
  MonthlyStatsQueryDto, WeeklyStatsQueryDto,
} from './dto/user-log.dto.js';
import {
  UserLogEntity, UserLogSummaryEntity,
  MonthlyStatsResponseEntity, WeeklyStatsResponseEntity,
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
      'ترکیب وزن + ورزش + تغذیه. unique([userId, date]) — تکراری → 409. ' +
      'اگر userPlanId داده شود، planned* از روی برنامه محاسبه می‌شود.',
  })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateUserLogDto) {
    return this.userLogService.create(userId, dto);
  }

  @Get()
  @Roles('USER')
  @ApiOkResponse({ type: PaginatedResponse(UserLogSummaryEntity, 'logs') })
  @ApiOperation({ summary: 'لیست لاگ‌های من (User)', description: 'مرتب بر اساس تاریخ desc' })
  getMyLogs(@CurrentUser('id') userId: string, @Query() query: QueryDefaultDto) {
    return this.userLogService.getMyLogs(userId, query);
  }

  // ---- Stats (باید قبل از مسیرهای پارامتری بیایند) ----

  @Get('stats/monthly')
  @Roles('USER')
  @ApiOkResponse({ type: MonthlyStatsResponseEntity })
  @ApiOperation({
    summary: 'آمار ماهانه یک سال شمسی (User)',
    description: 'حداکثر ۱۲ ردیف. ماه‌های بدون لاگ در خروجی نیستند.',
  })
  getMonthlyStats(@CurrentUser('id') userId: string, @Query() query: MonthlyStatsQueryDto) {
    return this.userLogService.getMonthlyStats(userId, query.year);
  }

  @Get('stats/weekly')
  @Roles('USER')
  @ApiOkResponse({ type: WeeklyStatsResponseEntity })
  @ApiOperation({
    summary: 'آمار هفتگی در یک بازه (User)',
    description: 'هفته از شنبه شروع می‌شود. حداکثر بازه ۴۰۰ روز.',
  })
  getWeeklyStats(@CurrentUser('id') userId: string, @Query() query: WeeklyStatsQueryDto) {
    return this.userLogService.getWeeklyStats(userId, query.from, query.to);
  }

  @Get('date/:date')
  @Roles('USER')
  @ApiOkResponse({ type: UserLogEntity })
  @ApiOperation({ summary: 'لاگ یک تاریخ خاص (User)', description: 'date به فرمت YYYY-MM-DD' })
  getByDate(@CurrentUser('id') userId: string, @Param('date') date: string) {
    return this.userLogService.getByDate(userId, date);
  }

  @Get('plan/:planId')
  @Roles('USER')
  @ApiOkResponse({ type: PaginatedResponse(UserLogEntity, 'logs') })
  @ApiOperation({ summary: 'لاگ‌های یک برنامه (User)' })
  getByPlan(@CurrentUser('id') userId: string, @Param('planId') planId: string, @Query() query: QueryDefaultDto) {
    return this.userLogService.getByPlan(userId, planId, query);
  }

  @Put(':id')
  @Roles('USER')
  @ApiOkResponse({ type: UserLogEntity })
  @ApiOperation({
    summary: 'ویرایش لاگ (User)',
    description: 'date و userPlanId قابل ویرایش نیستند (برای تغییر تاریخ: حذف و ثبت دوباره)',
  })
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
  @ApiOkResponse({ type: PaginatedResponse(UserLogEntity, 'logs') })
  @ApiOperation({ summary: 'لاگ‌های یک کاربر (Coach)', description: 'فقط لاگ‌های برنامه‌هایی که شما مربی آن هستید' })
  getCoachUserLogs(
    @CurrentUser('id') coachUserId: string,
    @Param('userId') userId: string,
    @Query() query: QueryDefaultDto,
  ) {
    return this.userLogService.getCoachUserLogs(coachUserId, userId, query);
  }

  @Patch(':id/coach-note')
  @Roles('COACH')
  @ApiOperation({ summary: 'ثبت یادداشت مربی (Coach)' })
  updateCoachNote(
    @CurrentUser('id') coachUserId: string,
    @Param('id') logId: string,
    @Body() dto: UpdateCoachNoteDto,
  ) {
    return this.userLogService.updateCoachNote(coachUserId, logId, dto.coachNote);
  }
}
