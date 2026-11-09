import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { UserPlanService } from './user-plan.service.js';
import {
  ActivateUserPlanDto, UpdateUserPlanSnapshotDto, UserPlanQueryDto,
  TodayQueryDto, PartQueryDto,
} from './dto/user-plan.dto.js';
import {
  UserPlanListItemEntity, CurrentUserPlanResponseEntity, TodayEntity, PartEntity,
  DraftResultEntity, CoachUserPlanListItemEntity, CoachUserPlanDetailEntity,
  UpdatedEntity, ActivatedEntity,
} from './entity/user-plan.entity.js';

@ApiTags('UserPlan')
@Controller('user-plan')
@UseGuards(AccessTokenGuard)
export class UserPlanController {
  constructor(private readonly userPlanService: UserPlanService) {}

  // ============ User ============
  // نکته‌ی پرفورمنس: برای صفحه‌ی اصلی فقط my/current و my/today را بزن.
  // my/current/workout و my/current/diet فقط یک فاز برمی‌گردانند، نه کل برنامه.

  @Get('my')
  @Roles('USER')
  @ApiOkResponse({ type: PaginatedResponse(UserPlanListItemEntity, 'plans') })
  @ApiOperation({
    summary: 'تاریخچه‌ی برنامه‌های من (User)',
    description: 'بدون snapshot و بدون پیش‌نویس‌ها. جدیدترین اول. فیلتر اختیاری status.',
  })
  getMyPlans(@CurrentUser('id') userId: string, @Query() query: UserPlanQueryDto) {
    return this.userPlanService.getMyPlans(userId, query);
  }

  @Get('my/current')
  @Roles('USER')
  @ApiOkResponse({ type: CurrentUserPlanResponseEntity })
  @ApiOperation({
    summary: 'برنامه‌ی فعال من — فقط متادیتا (User)',
    description:
      'هر کاربر حداکثر یک برنامه‌ی فعال دارد که می‌تواند هم ورزشی هم غذایی باشد (hasWorkout / hasDiet). ' +
      'اگر ندارد { plan: null }. snapshot برنمی‌گردد (سبک)؛ محتوا را از my/today یا my/current/workout|diet بگیر.',
  })
  getMyCurrent(@CurrentUser('id') userId: string) {
    return this.userPlanService.getMyCurrent(userId);
  }

  @Get('my/current/workout')
  @Roles('USER')
  @ApiOkResponse({ type: PartEntity })
  @ApiOperation({
    summary: 'فاز برنامه‌ی ورزشی (User)',
    description:
      'فازی که هفته‌ی week را پوشش می‌دهد (پیش‌فرض هفته‌ی جاری) همراه outline همه‌ی فازها برای ناوبری. ' +
      'بدون برنامه‌ی ورزشی فعال → 404.',
  })
  getMyWorkout(@CurrentUser('id') userId: string, @Query() query: PartQueryDto) {
    return this.userPlanService.getMyPart(userId, 'workout', query.week);
  }

  @Get('my/current/diet')
  @Roles('USER')
  @ApiOkResponse({ type: PartEntity })
  @ApiOperation({
    summary: 'فاز برنامه‌ی غذایی (User)',
    description: 'مثل my/current/workout برای برنامه‌ی غذایی. بدون برنامه‌ی غذایی فعال → 404.',
  })
  getMyDiet(@CurrentUser('id') userId: string, @Query() query: PartQueryDto) {
    return this.userPlanService.getMyPart(userId, 'diet', query.week);
  }

  // ============ Coach ============

  @Get('coach')
  @Roles('COACH')
  @ApiOkResponse({ type: PaginatedResponse(CoachUserPlanListItemEntity, 'plans') })
  @ApiOperation({
    summary: 'برنامه‌های شاگردان من (Coach)',
    description: 'فیلتر status=DRAFT برای پیش‌نویس‌های در حال ساخت و ACTIVE برای شاگردان فعال. بدون snapshot.',
  })
  getCoachPlans(@CurrentUser('id') coachUserId: string, @Query() query: UserPlanQueryDto) {
    return this.userPlanService.getCoachPlans(coachUserId, query);
  }

  @Post('coach/from-request/:requestId')
  @Roles('COACH')
  @ApiOkResponse({ type: DraftResultEntity })
  @ApiOperation({
    summary: 'ساخت پیش‌نویس برنامه از درخواست پرداخت‌شده (Coach)',
    description:
      'فقط وقتی درخواست PAID است. snapshot از روی قالب(ها) ساخته می‌شود و پلن با وضعیت DRAFT ثبت می‌شود (کاربر نمی‌بیند). ' +
      'idempotent: اگر قبلاً ساخته شده باشد created=false با همان id برمی‌گردد. ' +
      'درخواست «فقط غذایی» پیش‌نویس جدا (type=DIET) می‌گیرد و هنگام فعال‌سازی به برنامه‌ی فعال کاربر اضافه می‌شود.',
  })
  createDraft(@CurrentUser('id') coachUserId: string, @Param('requestId') requestId: string) {
    return this.userPlanService.createDraft(coachUserId, requestId);
  }

  @Get('coach/:id')
  @Roles('COACH')
  @ApiOkResponse({ type: CoachUserPlanDetailEntity })
  @ApiOperation({
    summary: 'جزئیات کامل برنامه‌ی یک شاگرد با snapshot (Coach)',
    description: 'برای صفحه‌ی ویرایش. snapshotها کامل برمی‌گردند (حجیم)؛ فقط هنگام ویرایش صدا بزن.',
  })
  getCoachPlan(@CurrentUser('id') coachUserId: string, @Param('id') id: string) {
    return this.userPlanService.getCoachPlan(coachUserId, id);
  }

  @Put('coach/:id/snapshot')
  @Roles('COACH')
  @ApiOkResponse({ type: UpdatedEntity })
  @ApiOperation({
    summary: 'ویرایش برنامه‌ی اختصاصی شاگرد (Coach)',
    description:
      'فقط پیش‌نویس. جایگزینی کامل workout و/یا diet. فقط id و پارامترها را بفرست؛ عنوان حرکت/غذا و کالری و ماکرو را سرور محاسبه می‌کند. ' +
      'برای وعده‌های موجود همان id قبلی را نگه دار. تغییرات فقط برای همین کاربر است و قالب اصلی دست‌نخورده می‌ماند. ' +
      'فازهای هم‌پوشان، weekday تکراری یا برنامه‌ی بدون حرکت/آیتم → 400.',
  })
  updateSnapshot(
    @CurrentUser('id') coachUserId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserPlanSnapshotDto,
  ) {
    return this.userPlanService.updateSnapshot(coachUserId, id, dto);
  }

  @Post('coach/:id/activate')
  @Roles('COACH')
  @ApiOkResponse({ type: ActivatedEntity })
  @ApiOperation({
    summary: 'تحویل برنامه به کاربر (Coach)',
    description:
      'پیش‌نویس را ACTIVE می‌کند و درخواست را DELIVERED. startDate اختیاری (پیش‌فرض امروز، حداکثر ۶۰ روز بعد). ' +
      'برای پلن «فقط غذایی» snapshot به برنامه‌ی فعال کاربر اضافه می‌شود (type → ALL) و id برگشتی id همان برنامه‌ی فعال است. ' +
      'اگر کاربر هم‌اکنون برنامه‌ی فعال دارد → 409.',
  })
  activate(
    @CurrentUser('id') coachUserId: string,
    @Param('id') id: string,
    @Body() dto: ActivateUserPlanDto,
  ) {
    return this.userPlanService.activate(coachUserId, id, dto);
  }
}
