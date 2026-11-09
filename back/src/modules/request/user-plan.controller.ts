import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseIntPipe,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse, ApiParam } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { UserPlanService } from './user-plan.service.js';
import {
  ActivateUserPlanDto,
  UpdateUserPlanSnapshotDto,
  UpdateWorkoutSnapshotDto,
  UpdateDietSnapshotDto,
  UserPlanQueryDto,
  PartQueryDto,
} from './dto/user-plan.dto.js';
import {
  UserPlanListItemEntity,
  CurrentUserPlanResponseEntity,
  PartEntity,
  DraftResultEntity,
  CoachUserPlanListItemEntity,
  CoachUserPlanDetailEntity,
  UpdatedEntity,
  ActivatedEntity,
} from './entity/user-plan.entity.js';

@ApiTags('UserPlan')
@Controller('user-plan')
@UseGuards(AccessTokenGuard)
export class UserPlanController {
  constructor(private readonly userPlanService: UserPlanService) { }

  // ═════════ Admin ═════════
  @Get('admin')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOkResponse({ type: PaginatedResponse(UserPlanListItemEntity, 'plans') })
  @ApiOperation({ summary: 'دریافت تمام برنامه ها (Admin)' })
  getPlansAdmin(@Query() query: UserPlanQueryDto) {
    return this.userPlanService.getPlansAdmin(query);
  }

  @Delete('admin/:planId')
  @Roles('SUPERADMIN', 'ADMIN')
  @ApiOperation({ summary: 'حذف برنامه ها (Super Admin)' })
  deletePlansAdmin(@Query('planId') planId: string) {
    return this.userPlanService.deletePlansAdmin(planId);
  }

  // ═════════ User ═════════
  /** 1 — تاریخچه‌ی برنامه‌های من */
  @Get('my')
  @Roles('USER')
  @ApiOkResponse({ type: PaginatedResponse(UserPlanListItemEntity, 'plans') })
  @ApiOperation({
    summary: '۱) تاریخچه‌ی برنامه‌های من (User)',
    description: 'بدون snapshot و بدون پیش‌نویس‌ها. جدیدترین اول. فیلتر اختیاری status.',
  })
  getMyPlans(@CurrentUser('id') userId: string, @Query() query: UserPlanQueryDto) {
    return this.userPlanService.getMyPlans(userId, query);
  }

  /** 2 — برنامه‌ی فعال (فقط متادیتا) */
  @Get('my/current')
  @Roles('USER')
  @ApiOkResponse({ type: CurrentUserPlanResponseEntity })
  @ApiOperation({
    summary: '۲) برنامه‌ی فعال من — فقط متادیتا (User)',
    description:
      'حداکثر یک برنامه‌ی فعال (hasWorkout / hasDiet / currentWeek). snapshot برنمی‌گردد.',
  })
  getMyCurrent(@CurrentUser('id') userId: string) {
    return this.userPlanService.getMyCurrent(userId);
  }

  /** 3 — برنامه‌ی هفتگی ورزشی جاری */
  @Get('my/current/workout')
  @Roles('USER')
  @ApiOkResponse({ type: PartEntity })
  @ApiOperation({
    summary: '۳) برنامه‌ی هفتگی ورزشی من (User)',
    description:
      'هفته‌ی جاری از startDate محاسبه می‌شود (یا ?week=N). فقط فاز جاری days کامل دارد؛ outline بقیه‌ی فازها سبک است.',
  })
  getMyWorkout(@CurrentUser('id') userId: string, @Query() query: PartQueryDto) {
    return this.userPlanService.getMyPart(userId, 'workout', query.week);
  }

  /** 4 — فاز ورزشی مشخص */
  @Get('my/current/workout/phase/:phase')
  @Roles('USER')
  @ApiOkResponse({ type: PartEntity })
  @ApiParam({ name: 'phase', example: 1, description: 'شماره‌ی فاز ۱-based (۱=فاز اول)' })
  @ApiOperation({
    summary: '۴) فاز ورزشی مشخص (User)',
    description: 'روزها + حرکات همان فاز. phase=1 یعنی اولین فاز (مثلاً هفته‌های ۱–۳).',
  })
  getMyWorkoutPhase(
    @CurrentUser('id') userId: string,
    @Param('phase', ParseIntPipe) phase: number,
  ) {
    return this.userPlanService.getMyPhase(userId, 'workout', phase);
  }

  /** 5 — برنامه‌ی هفتگی غذایی جاری */
  @Get('my/current/diet')
  @Roles('USER')
  @ApiOkResponse({ type: PartEntity })
  @ApiOperation({
    summary: '۵) برنامه‌ی هفتگی غذایی من (User)',
    description: 'مثل workout؛ startDate غذایی می‌تواند جدا باشد اگر بعداً اضافه شده.',
  })
  getMyDiet(@CurrentUser('id') userId: string, @Query() query: PartQueryDto) {
    return this.userPlanService.getMyPart(userId, 'diet', query.week);
  }

  /** 6 — فاز غذایی مشخص */
  @Get('my/current/diet/phase/:phase')
  @Roles('USER')
  @ApiOkResponse({ type: PartEntity })
  @ApiParam({ name: 'phase', example: 1 })
  @ApiOperation({
    summary: '۶) فاز غذایی مشخص (User)',
    description: 'روزها + وعده‌های همان فاز.',
  })
  getMyDietPhase(
    @CurrentUser('id') userId: string,
    @Param('phase', ParseIntPipe) phase: number,
  ) {
    return this.userPlanService.getMyPhase(userId, 'diet', phase);
  }

  // ═════════ Coach ═════════

  /** 7 — برنامه‌های شاگردان */
  @Get('coach')
  @Roles('COACH')
  @ApiOkResponse({ type: PaginatedResponse(CoachUserPlanListItemEntity, 'plans') })
  @ApiOperation({
    summary: '۷) برنامه‌های شاگردان من (Coach)',
    description: 'فیلتر status=DRAFT | ACTIVE. بدون snapshot.',
  })
  getCoachPlans(@CurrentUser('id') coachUserId: string, @Query() query: UserPlanQueryDto) {
    return this.userPlanService.getCoachPlans(coachUserId, query);
  }

  @Post('coach/from-request/:requestId')
  @Roles('COACH')
  @ApiOkResponse({ type: DraftResultEntity })
  @ApiOperation({
    summary: 'ساخت پیش‌نویس از درخواست PAID (Coach)',
    description:
      'snapshot از قالب‌ها ساخته می‌شود → DRAFT. idempotent. غذاییِ تنها فقط در activate به پلن ورزشی فعال merge می‌شود.',
  })
  createDraft(@CurrentUser('id') coachUserId: string, @Param('requestId') requestId: string) {
    return this.userPlanService.createDraft(coachUserId, requestId);
  }

  /** 9 — جزئیات شاگرد */
  @Get('coach/:id')
  @Roles('COACH')
  @ApiOkResponse({ type: CoachUserPlanDetailEntity })
  @ApiOperation({
    summary: '۹) جزئیات برنامه‌ی شاگرد با outline فازها + snapshot کامل (Coach)',
    description:
      'برای ویرایش. outline سبک برای ناوبری؛ برای days یک فاز از GET coach/:id/workout|diet/phase/:phase استفاده کن.',
  })
  getCoachPlan(@CurrentUser('id') coachUserId: string, @Param('id') id: string) {
    return this.userPlanService.getCoachPlan(coachUserId, id);
  }

  @Get('coach/:id/workout/phase/:phase')
  @Roles('COACH')
  @ApiOkResponse({ type: PartEntity })
  @ApiOperation({ summary: 'فاز ورزشی شاگرد (Coach)' })
  getCoachWorkoutPhase(
    @CurrentUser('id') coachUserId: string,
    @Param('id') id: string,
    @Param('phase', ParseIntPipe) phase: number,
  ) {
    return this.userPlanService.getPlanPhase(
      { userId: coachUserId, asCoach: true },
      id,
      'workout',
      phase,
    );
  }

  @Get('coach/:id/diet/phase/:phase')
  @Roles('COACH')
  @ApiOkResponse({ type: PartEntity })
  @ApiOperation({ summary: 'فاز غذایی شاگرد (Coach)' })
  getCoachDietPhase(
    @CurrentUser('id') coachUserId: string,
    @Param('id') id: string,
    @Param('phase', ParseIntPipe) phase: number,
  ) {
    return this.userPlanService.getPlanPhase(
      { userId: coachUserId, asCoach: true },
      id,
      'diet',
      phase,
    );
  }

  /** 11 — ویرایش ورزشی (جدا) */
  @Put('coach/:id/snapshot/workout')
  @Roles('COACH')
  @ApiOkResponse({ type: UpdatedEntity })
  @ApiOperation({
    summary: '۱۱) ویرایش فقط بخش ورزشی (Coach)',
    description:
      'جایگزینی کامل snapshot ورزشی. title/cover حرکت از DB پر می‌شود. فازهای هم‌پوشان / weekday تکراری → 400.',
  })
  updateWorkout(
    @CurrentUser('id') coachUserId: string,
    @Param('id') id: string,
    @Body() dto: UpdateWorkoutSnapshotDto,
  ) {
    return this.userPlanService.updateWorkoutSnapshot(coachUserId, id, dto);
  }

  /** 10 — ویرایش غذایی (جدا) */
  @Put('coach/:id/snapshot/diet')
  @Roles('COACH')
  @ApiOkResponse({ type: UpdatedEntity })
  @ApiOperation({
    summary: '۱۰) ویرایش فقط بخش غذایی (Coach)',
    description: 'جایگزینی کامل snapshot غذایی. کالری/ماکرو سرور حساب می‌کند. id وعده‌ها را برای log حفظ کن.',
  })
  updateDiet(
    @CurrentUser('id') coachUserId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDietSnapshotDto,
  ) {
    return this.userPlanService.updateDietSnapshot(coachUserId, id, dto);
  }

  /** سازگاری عقب‌رو — ترجیحاً از endpointهای جدا استفاده شود */
  @Put('coach/:id/snapshot')
  @Roles('COACH')
  @ApiOkResponse({ type: UpdatedEntity })
  @ApiOperation({
    summary: 'ویرایش ترکیبی snapshot (deprecated — از /snapshot/workout و /snapshot/diet استفاده کنید)',
  })
  updateSnapshot(
    @CurrentUser('id') coachUserId: string,
    @Param('id') id: string,
    @Body() dto: UpdateUserPlanSnapshotDto,
  ) {
    return this.userPlanService.updateSnapshot(coachUserId, id, dto);
  }

  /** 12 — فعال‌سازی */
  @Post('coach/:id/activate')
  @Roles('COACH')
  @ApiOkResponse({ type: ActivatedEntity })
  @ApiOperation({
    summary: '۱۲) فعال‌سازی برنامه (Coach)',
    description:
      'DRAFT → ACTIVE. startDate/endDate اختیاری (پیش‌فرض: امروز و duration از snapshot). ' +
      'snapshot از قبل در DRAFT کپی شده. غذاییِ تنها روی پلن ورزشی فعال merge می‌شود. تداخل ACTIVE → 409.',
  })
  activate(
    @CurrentUser('id') coachUserId: string,
    @Param('id') id: string,
    @Body() dto: ActivateUserPlanDto,
  ) {
    return this.userPlanService.activate(coachUserId, id, dto);
  }

  // ─── routeهای پارامتری در انتها (بعد از مسیرهای ثابت coach/my) ───

  /** فاز یک پلن مشخص (تاریخچه / مالک) */
  @Get(':planId/workout/phase/:phase')
  @Roles('USER')
  @ApiOkResponse({ type: PartEntity })
  @ApiOperation({
    summary: 'فاز ورزشی یک پلن با id (User — مالک)',
    description: 'برای برنامه‌های قدیمی/غیرفعال. planId + phase.',
  })
  getPlanWorkoutPhase(
    @CurrentUser('id') userId: string,
    @Param('planId') planId: string,
    @Param('phase', ParseIntPipe) phase: number,
  ) {
    return this.userPlanService.getPlanPhase({ userId }, planId, 'workout', phase);
  }

  @Get(':planId/diet/phase/:phase')
  @Roles('USER')
  @ApiOkResponse({ type: PartEntity })
  @ApiOperation({ summary: 'فاز غذایی یک پلن با id (User — مالک)' })
  getPlanDietPhase(
    @CurrentUser('id') userId: string,
    @Param('planId') planId: string,
    @Param('phase', ParseIntPipe) phase: number,
  ) {
    return this.userPlanService.getPlanPhase({ userId }, planId, 'diet', phase);
  }
}
