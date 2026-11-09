import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, UseGuards,
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
  CreateDietPhaseDto, UpdateDietPhaseDto,
  CreateDietDayDto, UpdateDietDayDto, CopyDietDayDto,
  CreateDietMealDto, UpdateDietMealDto,
  CreateDietMealItemDto, UpdateDietMealItemDto,
  SearchPlanDietCoach,
  SearchPlanDietAdmin,
  SearchPlanDietUser,
} from './dto/diet.dto.js';
import {
  DietPlanSummaryEntity, DietPlanDetailEntity, DietPlanPublicEntity,
  DietPhaseRecordEntity, DietDayRecordEntity, DietDayCopyEntity,
  DietMealRecordEntity, DietMealItemRecordEntity,
  DietPublishEntity, SuccessEntity,
  DietPhaseEntity,
} from './entity/diet.entity.js';

@ApiTags('Diet')
@Controller('diet')
export class DietController {
  constructor(private readonly dietService: DietService) { }

  // ============ Coach: Plan (قبل از مسیرهای پارامتری بیایند) ============
  // ترتیب مهم است: plan/my باید قبل از plan/:id تعریف شود.
  @Get('plan/my')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: PaginatedResponse(DietPlanSummaryEntity, 'dietPlans') })
  @ApiOperation({
    summary: 'لیست برنامه‌های غذایی من (Coach)',
    description: 'شامل پیش‌نویس و منتشرشده. مرتب بر اساس آخرین ویرایش. فقط اطلاعات خلاصه؛ برای محتوا از plan/my/:id استفاده کن.',
  })
  getMyPlans(@CurrentUser('id') userId: string, @Query() query: SearchPlanDietCoach) {
    return this.dietService.getMyPlans(userId, query);
  }

  @Get('plan/my-selector')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOperation({
    summary: 'لیست برنامه‌های غذایی من  به صورت انتخابگر(Coach)',
  })
  getMyPlansSelector(@CurrentUser('id') userId: string) {
    return this.dietService.getMyPlansSelector(userId);
  }

  @Get('plan/my/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: DietPlanDetailEntity })
  @ApiOperation({
    summary: 'جزئیات کامل برنامه غذایی (Coach)',
    description:
      'همه‌ی فازها (مرتب بر اساس startWeek) ← روزها (weekday) ← وعده‌ها (order) ← آیتم‌ها. ' +
      'هر آیتم/وعده/روز فیلد nutrition دارد (calories, proteinG, carbsG, fatG). ' +
      'nutrition روز فقط وعده‌های PRIMARY را جمع می‌زند. ' +
      'food.isActive=false یعنی غذا غیرفعال شده و باید عوض شود. فقط برنامه‌ی خود مربی؛ در غیر این صورت 404.'
  })
  getMyPlan(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.dietService.getMyPlan(userId, id);
  }

  // ============ Admin ============

  @Get('plan/admin')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: PaginatedResponse(DietPlanSummaryEntity, 'dietPlans') })
  @ApiOperation({
    summary: 'لیست برنامه‌های غذایی (Admin)',
  })
  getAdminPlans(@Query() query: SearchPlanDietAdmin) {
    return this.dietService.getAdminPlans(query);
  }

  @Get('plan/admin/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: DietPlanDetailEntity })
  @ApiOperation({
    summary: 'جزئیات برنامه غذایی (Admin)'
  })
  getAdminPlan(@Param('id') id: string) {
    return this.dietService.getAdminPlan(id);
  }

  // ============ Public ============

  @Get('plan')
  @ApiOkResponse({ type: PaginatedResponse(DietPlanSummaryEntity, 'dietPlans') })
  @ApiOperation({
    summary: 'لیست برنامه‌های غذایی منتشرشده (Public)',
    description:
      'فقط برنامه‌های منتشرشده (و مربی‌ی تاییدشده یا برنامه‌ی سایت/AI). مرتب بر اساس avgRating سپس جدیدترین. ' +
      'اگر discountExpired گذشته باشد discountPrice برابر null است.',
  })
  getPlans(@Query() query: SearchPlanDietUser) {
    return this.dietService.getPlans(query);
  }

  @Get('plan/:id')
  @ApiOkResponse({ type: DietPlanPublicEntity })
  @ApiOperation({
    summary: 'جزئیات برنامه غذایی (Public)',
    description:
      'نمای محدود (isPreview=true): فقط اولین فاز، حداکثر ۳ روز، ۳ وعده در هر روز و ۳ آیتم در هر وعده. ' +
      'phaseCount و dayCount تعداد کل را می‌دهند تا UI بنویسد «+۱۸ روز دیگر». ' +
      'برنامه‌ی نامنتشر یا مربی‌ی تاییدنشده → 404.',
  })
  getPlan(@Param('id') id: string) {
    return this.dietService.getPlan(id);
  }

  @Post('plan')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: DietPlanSummaryEntity })
  @ApiOperation({
    summary: 'ایجاد برنامه غذایی (Coach)',
    description:
      'همیشه به‌صورت پیش‌نویس (isPublished=false) و source=COACH ساخته می‌شود. ' +
      'discountPrice نباید از price بیشتر باشد (400). trainingGoalId نامعتبر → 400.',
  })
  createPlan(@CurrentUser('id') userId: string, @Body() dto: CreateDietPlanDto) {
    return this.dietService.createPlan(userId, dto);
  }

  @Put('plan/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: DietPlanSummaryEntity })
  @ApiOperation({
    summary: 'ویرایش برنامه غذایی (Coach)',
    description:
      'همه‌ی فیلدها اختیاری. کاهش durationWeeks به کمتر از آخرین هفته‌ی فازها → 400. ' +
      'برای حذف تخفیف discountPrice و discountExpired را null بفرست.',
  })
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
  @ApiOkResponse({ type: DietPublishEntity })
  @ApiOperation({
    summary: 'انتشار / لغو انتشار برنامه (Coach)',
    description:
      'toggle می‌کند. لغو انتشار همیشه مجاز است. ' +
      'انتشار فقط وقتی مجاز است که حساب مربی APPROVED باشد و برنامه کامل باشد ' +
      '(حداقل یک فاز و یک آیتم، بدون روز خالی و بدون وعده‌ی خالی). ' +
      'در غیر این صورت 400 با آرایه‌ی message از مشکلات.',
  })
  togglePublish(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.dietService.togglePublish(userId, id);
  }

  @Delete('plan/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: SuccessEntity })
  @ApiOperation({
    summary: 'حذف برنامه غذایی (Coach)',
    description:
      'فازها، روزها، وعده‌ها و آیتم‌ها نیز حذف می‌شوند (Cascade). ' +
      'اگر کاربری این برنامه را دریافت کرده باشد → 409 (به‌جای حذف، انتشار را لغو کن).',
  })
  deletePlan(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.dietService.deletePlan(userId, id);
  }

  // ============ Coach: Phase ============
  @Get('phase/:phaseId')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH', 'ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: DietPhaseEntity })
  @ApiOperation({ summary: 'گرفتن یک فاز یا هفته به صورت کامل (Coach , Admin)' })
  getOnePhase(@Param('phaseId') phaseId: string) {
    return this.dietService.getOnePhase(phaseId);
  }

  @Post('plan/:planId/phase')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: DietPhaseRecordEntity })
  @ApiOperation({
    summary: 'افزودن فاز به برنامه (Coach)',
    description:
      'بازه‌ی [startWeek, endWeek] شامل است و نباید با فاز دیگر تداخل داشته باشد (400). ' +
      'endWeek نباید از durationWeeks+۱ بیشتر باشد (400). startWeek تکراری → 409.',
  })
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
  @ApiOkResponse({ type: DietPhaseRecordEntity })
  @ApiOperation({
    summary: 'ویرایش فاز (Coach)',
    description: 'همه‌ی فیلدها اختیاری. تداخل بازه → 400، startWeek تکراری → 409.',
  })
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
  @ApiOkResponse({ type: SuccessEntity })
  @ApiOperation({
    summary: 'حذف فاز (Coach)',
    description: 'روزها، وعده‌ها و آیتم‌های فاز نیز حذف می‌شوند (Cascade).',
  })
  deletePhase(@CurrentUser('id') userId: string, @Param('phaseId') phaseId: string) {
    return this.dietService.deletePhase(userId, phaseId);
  }

  // ============ Coach: Day ============

  @Post('plan/:planId/day')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: DietDayRecordEntity })
  @ApiOperation({
    summary: 'افزودن روز به فاز (Coach)',
    description:
      'dietPhaseId الزامی است و باید متعلق به همین برنامه باشد (در غیر این صورت 404). ' +
      'weekday: ۰=شنبه … ۶=جمعه. weekday تکراری در همان فاز → 409.',
  })
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
  @ApiOkResponse({ type: DietDayRecordEntity })
  @ApiOperation({
    summary: 'ویرایش روز (Coach)',
    description:
      'فقط weekday، title و notes. انتقال روز به فاز دیگر ممکن نیست (از «کپی روز» استفاده کن). ' +
      'weekday تکراری → 409.',
  })
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
  @ApiOkResponse({ type: SuccessEntity })
  @ApiOperation({
    summary: 'حذف روز (Coach)',
    description: 'وعده‌ها و آیتم‌های روز نیز حذف می‌شوند (Cascade).',
  })
  deleteDay(@CurrentUser('id') userId: string, @Param('dayId') dayId: string) {
    return this.dietService.deleteDay(userId, dayId);
  }

  @Post('day/:dayId/copy')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: DietDayCopyEntity })
  @ApiOperation({
    summary: 'کپی روز با همه‌ی وعده‌ها و آیتم‌ها (Coach)',
    description:
      'روز مبدأ را در یک تراکنش به weekday (و در صورت نیاز فاز) مقصد کپی می‌کند. ' +
      'dietPhaseId اختیاری است (پیش‌فرض: همان فاز) و باید متعلق به همین برنامه باشد (400). ' +
      'weekday مقصد از قبل وجود داشته باشد → 409.',
  })
  copyDay(
    @CurrentUser('id') userId: string,
    @Param('dayId') dayId: string,
    @Body() dto: CopyDietDayDto,
  ) {
    return this.dietService.copyDay(userId, dayId, dto);
  }

  // ============ Coach: Meal ============

  @Post('day/:dayId/meal')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: DietMealRecordEntity })
  @ApiOperation({
    summary: 'افزودن وعده به روز (Coach)',
    description:
      'type: BREAKFAST | LUNCH | DINNER | SNACK. priority پیش‌فرض PRIMARY است؛ ' +
      'SECONDARY/TERTIARY جایگزین‌اند و در جمع کالری روز حساب نمی‌شوند.',
  })
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
  @ApiOkResponse({ type: DietMealRecordEntity })
  @ApiOperation({ summary: 'ویرایش وعده (Coach)', description: 'همه‌ی فیلدها اختیاری.' })
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
  @ApiOkResponse({ type: SuccessEntity })
  @ApiOperation({ summary: 'حذف وعده (Coach)', description: 'آیتم‌های وعده نیز حذف می‌شوند (Cascade).' })
  deleteMeal(@CurrentUser('id') userId: string, @Param('mealId') mealId: string) {
    return this.dietService.deleteMeal(userId, mealId);
  }

  // ============ Coach: Meal item ============

  @Post('meal/:mealId/item')
  @UseGuards(AccessTokenGuard)
  @Roles('COACH')
  @ApiOkResponse({ type: DietMealItemRecordEntity })
  @ApiOperation({
    summary: 'افزودن غذا به وعده (Coach)',
    description:
      'foodId باید غذای فعال باشد (در غیر این صورت 400). quantityGrams: ۰.۰۱ تا ۹۹۹۹ گرم. ' +
      'کالری و ماکرو در GET plan/my/:id محاسبه و برگردانده می‌شود.',
  })
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
  @ApiOkResponse({ type: DietMealItemRecordEntity })
  @ApiOperation({
    summary: 'ویرایش آیتم وعده (Coach)',
    description: 'همه‌ی فیلدها اختیاری. اگر foodId عوض شود باید غذای فعال باشد.',
  })
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
  @ApiOkResponse({ type: SuccessEntity })
  @ApiOperation({ summary: 'حذف آیتم از وعده (Coach)' })
  deleteMealItem(@CurrentUser('id') userId: string, @Param('itemId') itemId: string) {
    return this.dietService.deleteMealItem(userId, itemId);
  }
}
