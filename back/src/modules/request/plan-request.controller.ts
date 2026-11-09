import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { PlanRequestService } from './plan-request.service.js';
import {
  CreatePlanRequestDto, RejectPlanRequestDto, PlanRequestQueryDto,
} from './dto/plan-request.dto.js';
import {
  PlanRequestEntity, PlanRequestCoachItemEntity, PlanRequestCoachDetailEntity,
  PlanRequestStatusEntity, PlanRequestAcceptEntity,
} from './entity/plan-request.entity.js';

@ApiTags('PlanRequest')
@Controller('plan-request')
@UseGuards(AccessTokenGuard)
export class PlanRequestController {
  constructor(private readonly planRequestService: PlanRequestService) {}

  // ============ User ============

  @Post()
  @Roles('USER')
  @ApiOkResponse({ type: PlanRequestEntity })
  @ApiOperation({
    summary: 'ثبت درخواست برنامه از مربی (User)',
    description:
      'workoutTemplateId و/یا dietTemplateId (حداقل یکی). مربی از روی برنامه‌ها تعیین می‌شود و هر دو برنامه باید از یک مربی باشند.\n\n' +
      'قوانین:\n' +
      '• سقف ۵ درخواست در روز (به وقت تهران)؛ لغوشده‌ها هم شمرده می‌شوند → 429\n' +
      '• سقف ۵ درخواست باز هم‌زمان (PENDING + ACCEPTED) → 429\n' +
      '• هر کاربر هم‌زمان فقط یک برنامه‌ی ورزشی و یک برنامه‌ی غذایی فعال دارد؛ اگر دارد (یا پرداخت‌کرده و منتظر تحویل است) → 409\n' +
      '• برنامه‌ی غذایی بدون برنامه‌ی ورزشی ممکن نیست: یا هر دو را با هم درخواست بده، یا برنامه‌ی ورزشی فعال داشته باش → 400\n' +
      '• «فقط غذایی» باید از همان مربی‌ی برنامه‌ی ورزشی فعال باشد (اگر برنامه‌ی ورزشی از مربی است) → 400\n' +
      '• درخواست تکراری باز برای همان برنامه‌ها → 409\n' +
      '• قیمت در همین لحظه ثابت می‌شود.',
  })
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePlanRequestDto) {
    return this.planRequestService.create(userId, dto);
  }

  @Get('my')
  @Roles('USER')
  @ApiOkResponse({ type: PaginatedResponse(PlanRequestEntity, 'requests') })
  @ApiOperation({
    summary: 'درخواست‌های من (User)',
    description: 'جدیدترین اول. فیلتر اختیاری status. وقتی status=ACCEPTED است payableUntil مهلت پرداخت را می‌دهد.',
  })
  getMyRequests(@CurrentUser('id') userId: string, @Query() query: PlanRequestQueryDto) {
    return this.planRequestService.getMyRequests(userId, query);
  }

  @Patch(':id/cancel')
  @Roles('USER')
  @ApiOkResponse({ type: PlanRequestStatusEntity })
  @ApiOperation({
    summary: 'لغو درخواست (User)',
    description: 'فقط در وضعیت PENDING یا ACCEPTED (قبل از پرداخت). بعد از پرداخت → 409. درخواست لغوشده همچنان در سقف روزانه شمرده می‌شود.',
  })
  cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.planRequestService.cancel(userId, id);
  }

  // ============ Coach (قبل از مسیرهای پارامتری) ============

  @Get('coach')
  @Roles('COACH')
  @ApiOkResponse({ type: PaginatedResponse(PlanRequestCoachItemEntity, 'requests') })
  @ApiOperation({
    summary: 'درخواست‌های دریافتی من (Coach)',
    description: 'جدیدترین اول. برای صف بررسی از status=PENDING و برای ساخت برنامه از status=PAID استفاده کن.',
  })
  getCoachRequests(@CurrentUser('id') coachUserId: string, @Query() query: PlanRequestQueryDto) {
    return this.planRequestService.getCoachRequests(coachUserId, query);
  }

  @Get('coach/:id')
  @Roles('COACH')
  @ApiOkResponse({ type: PlanRequestCoachDetailEntity })
  @ApiOperation({
    summary: 'جزئیات درخواست + پروفایل کاربر (Coach)',
    description: 'پروفایل شامل قد، وزن، سطح، آسیب‌ها، بیماری، حساسیت‌ها و محدودیت‌های غذایی برای تصمیم‌گیری مربی است.',
  })
  getCoachRequest(@CurrentUser('id') coachUserId: string, @Param('id') id: string) {
    return this.planRequestService.getCoachRequest(coachUserId, id);
  }

  @Patch('coach/:id/accept')
  @Roles('COACH')
  @ApiOkResponse({ type: PlanRequestAcceptEntity })
  @ApiOperation({
    summary: 'تایید درخواست (Coach)',
    description:
      'فقط از وضعیت PENDING. بعد از تایید کاربر ۴۸ ساعت مهلت پرداخت دارد (payableUntil).\n' +
      '• اگر حساب مربی APPROVED نباشد → 400\n' +
      '• ظرفیت (maxClients) برای مشتری‌ی جدید چک می‌شود → 409 (غذایی‌ِ مشتری‌ی فعلی ظرفیت نمی‌گیرد)\n' +
      '• برنامه‌ی رایگان (مبلغ ۰) بدون پرداخت مستقیم PAID می‌شود.',
  })
  accept(@CurrentUser('id') coachUserId: string, @Param('id') id: string) {
    return this.planRequestService.accept(coachUserId, id);
  }

  @Patch('coach/:id/reject')
  @Roles('COACH')
  @ApiOkResponse({ type: PlanRequestStatusEntity })
  @ApiOperation({
    summary: 'رد درخواست (Coach)',
    description: 'فقط از وضعیت PENDING. reason الزامی است و به کاربر نمایش داده می‌شود.',
  })
  reject(
    @CurrentUser('id') coachUserId: string,
    @Param('id') id: string,
    @Body() dto: RejectPlanRequestDto,
  ) {
    return this.planRequestService.reject(coachUserId, id, dto.reason);
  }
}
