import {
  Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Header,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import {
  ActivateUserPlanDto, UpdateWorkoutSnapshotDto, UpdateDietSnapshotDto,
  UpdatePlanDatesDto, UserPlanQueryDto, PartQueryDto,
} from './dto/user-plan.dto.js';
import {
  UserPlanListItemEntity, CurrentUserPlanResponseEntity, PartEntity, DraftResultEntity,
  CoachUserPlanListItemEntity, CoachUserPlanDetailEntity, UpdatedEntity, ActivatedEntity,
  StatusChangedEntity, DatesUpdatedEntity,
} from './entity/user-plan.entity.js';
import { UserPlanService } from './user-plan.service.js';

const PART_CACHE = 'private, max-age=10'; // جلوگیری از درخواست‌های تکراری فرانت

@ApiTags('UserPlan')
@Controller('user-plan')
@UseGuards(AccessTokenGuard)
export class UserPlanController {
  constructor(private readonly userPlanService: UserPlanService) { }

  // ═════════ Admin ═════════
  @Get('admin')
  // @Roles('SUPERADMIN', 'ADMIN')
  @ApiOkResponse({ type: PaginatedResponse(UserPlanListItemEntity, 'plans') })
  @ApiOperation({ summary: 'دریافت تمام برنامه‌ها (Admin)', description: 'همه‌ی وضعیت‌ها از جمله DRAFT؛ فیلتر اختیاری status.' })
  getPlansAdmin(@Query() query: UserPlanQueryDto) {
    return this.userPlanService.getPlansAdmin(query);
  }

  @Delete('admin/:planId')
  // @Roles('SUPERADMIN')
  @ApiOperation({
    summary: 'حذف برنامه — فقط موارد اضطراری (Super Admin)',
    description: 'لاگ‌های کاربر حذف نمی‌شوند؛ فقط از برنامه جدا می‌شوند.',
  })
  deletePlansAdmin(@Param('planId') planId: string) {
    return this.userPlanService.deletePlansAdmin(planId);
  }

  // ═════════ User ═════════
  @Get('my')
  @Roles('USER')
  @ApiOkResponse({ type: PaginatedResponse(UserPlanListItemEntity, 'plans') })
  @ApiOperation({
    summary: 'تاریخچه‌ی برنامه‌های من (User)',
    description: 'بدون snapshot و بدون پیش‌نویس. فیلتر اختیاری status (مثلاً ACTIVE).',
  })
  getMyPlans(@CurrentUser('id') userId: string, @Query() query: UserPlanQueryDto) {
    return this.userPlanService.getMyPlans(userId, query);
  }

  @Get('my/current')
  @Roles('USER')
  @ApiOkResponse({ type: CurrentUserPlanResponseEntity })
  @ApiOperation({
    summary: 'برنامه‌ی فعال من — فقط متادیتا (User)',
    description: 'بدون snapshot (فقط ستون‌های سبک). از id آن برای :planId/workout و :planId/diet استفاده کن.'
  })
  getMyCurrent(@CurrentUser('id') userId: string) {
    return this.userPlanService.getMyCurrent(userId);
  }

  // ═════════ Coach ═════════
  @Get('coach')
  @Roles('COACH')
  @ApiOkResponse({ type: PaginatedResponse(CoachUserPlanListItemEntity, 'plans') })
  @ApiOperation({ summary: 'برنامه‌های شاگردان من (Coach)', description: 'پیش‌فرض بدون CANCELLED. بدون snapshot.' })
  getCoachPlans(@CurrentUser('id') coachUserId: string, @Query() query: UserPlanQueryDto) {
    return this.userPlanService.getCoachPlans(coachUserId, query);
  }

  @Post('coach/from-request/:requestId')
  @Roles('COACH')
  @ApiOkResponse({ type: DraftResultEntity })
  @ApiOperation({
    summary: 'ساخت پیش‌نویس از درخواست PAID (Coach)',
    description:
      'snapshot از قالب‌ها ساخته می‌شود → DRAFT (آماده‌ی تحویل؛ ویرایش اجباری نیست و می‌توان مستقیم activate کرد). idempotent.',
  })
  createDraft(@CurrentUser('id') coachUserId: string, @Param('requestId') requestId: string) {
    return this.userPlanService.createDraft(coachUserId, requestId);
  }

  @Get('coach/:id')
  @Roles('COACH')
  @ApiOkResponse({ type: CoachUserPlanDetailEntity })
  @ApiOperation({ summary: 'جزئیات کامل برنامه‌ی شاگرد برای ویرایش (Coach)', description: 'snapshot کامل ورزشی و غذایی + outline فازها.' })
  getCoachPlan(@CurrentUser('id') coachUserId: string, @Param('id') id: string) {
    return this.userPlanService.getCoachPlan(coachUserId, id);
  }

  @Put('coach/:id/snapshot/workout')
  @Roles('COACH')
  @ApiOkResponse({ type: UpdatedEntity })
  @ApiOperation({ summary: 'ویرایش فقط بخش ورزشی (Coach)', description: 'فقط DRAFT/ACTIVE. فازهای هم‌پوشان / weekday تکراری → 400.' })
  updateWorkout(@CurrentUser('id') coachUserId: string, @Param('id') id: string, @Body() dto: UpdateWorkoutSnapshotDto) {
    return this.userPlanService.updateWorkoutSnapshot(coachUserId, id, dto);
  }

  @Put('coach/:id/snapshot/diet')
  @Roles('COACH')
  @ApiOkResponse({ type: UpdatedEntity })
  @ApiOperation({ summary: 'ویرایش فقط بخش غذایی (Coach)', description: 'فقط DRAFT/ACTIVE. id وعده‌ها را برای حفظ log بفرست.' })
  updateDiet(@CurrentUser('id') coachUserId: string, @Param('id') id: string, @Body() dto: UpdateDietSnapshotDto) {
    return this.userPlanService.updateDietSnapshot(coachUserId, id, dto);
  }

  @Post('coach/:id/activate')
  @Roles('COACH')
  @ApiOkResponse({ type: ActivatedEntity })
  @ApiOperation({
    summary: 'فعال‌سازی برنامه (Coach)',
    description: 'DRAFT → ACTIVE (بدون نیاز به ویرایش). غذاییِ تنها روی پلن ورزشی فعال merge می‌شود. تداخل → 409.',
  })
  activate(@CurrentUser('id') coachUserId: string, @Param('id') id: string, @Body() dto: ActivateUserPlanDto) {
    return this.userPlanService.activate(coachUserId, id, dto);
  }

  @Patch('coach/:id/dates')
  @Roles('COACH')
  @ApiOkResponse({ type: DatesUpdatedEntity })
  @ApiOperation({ summary: 'تغییر تاریخ شروع/پایان برنامه‌ی فعال (Coach)' })
  updateDates(@CurrentUser('id') coachUserId: string, @Param('id') id: string, @Body() dto: UpdatePlanDatesDto) {
    return this.userPlanService.updateDates(coachUserId, id, dto);
  }

  @Patch('coach/:id/cancel')
  @Roles('COACH')
  @ApiOkResponse({ type: StatusChangedEntity })
  @ApiOperation({ summary: 'لغو برنامه (DRAFT/ACTIVE) (Coach)' })
  cancel(@CurrentUser('id') coachUserId: string, @Param('id') id: string) {
    return this.userPlanService.cancel(coachUserId, id);
  }

  // ═════════ مشترک (کاربر / مربی / ادمین) — پارامتری‌ها در انتها ═════════

  @Get(':planId/workout')
  @Roles('USER', 'COACH', 'ADMIN', 'SUPERADMIN')
  @Header('Cache-Control', PART_CACHE)
  @ApiOkResponse({ type: PartEntity })
  @ApiOperation({
    summary: 'برنامه‌ی ورزشی یک پلن: هفته/فاز جاری یا مشخص (User & Admin & Coach)',
    description: `
    * برنامه کاربر ارسال میشه با لاگ های کاربر که برنامه را تا چه اندازه انجام داده
    * فاز مشخص شده با جزئیات ارسال میشه یعنی شامل روز ها و ست های ورزشی و حرکات
    * سعی کن فقط از بخش فاز استفاده کنی هفته خوب کار نمیکنه 
    * تو باید به صورت کامل توی فرانت نمایش بدی یعنی اگر زدیم فاز 1 از هفته 1 تا 4 تو باید 4 هفته به کاربر نمایش بدی
    * اطلاعات لاگ ها داخل summary هستش 
    * اطلاعات لاگ فاز مشخص شده داخل calendar هستش 
    `
  })
  getWorkoutPart(@Param('planId') planId: string, @Query() query: PartQueryDto) {
    return this.userPlanService.getPlanPart(planId, 'workout', query);
  }

  @Get(':planId/diet')
  @Roles('USER', 'COACH', 'ADMIN', 'SUPERADMIN')
  @Header('Cache-Control', PART_CACHE)
  @ApiOkResponse({ type: PartEntity })
  @ApiOperation({
    summary: 'برنامه‌ی غذایی یک پلن: هفته/فاز جاری یا مشخص (User & Admin & Coach)',
    description: `
    * برنامه کاربر ارسال میشه با لاگ های کاربر که برنامه را تا چه اندازه انجام داده
    * فاز مشخص شده با جزئیات ارسال میشه یعنی شامل روز ها و ست های ورزشی و حرکات
    * سعی کن فقط از بخش فاز استفاده کنی هفته خوب کار نمیکنه 
    * تو باید به صورت کامل توی فرانت نمایش بدی یعنی اگر زدیم فاز 1 از هفته 1 تا 4 تو باید 4 هفته به کاربر نمایش بدی
    * اطلاعات لاگ ها داخل summary هستش 
    * اطلاعات لاگ فاز مشخص شده داخل calendar هستش 
    `
  })
  getDietPart(@Param('planId') planId: string, @Query() query: PartQueryDto) {
    return this.userPlanService.getPlanPart(planId, 'diet', query);
  }
}