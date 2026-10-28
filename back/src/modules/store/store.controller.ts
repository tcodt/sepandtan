import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { StoreService } from './store.service.js';
import { AnswerStoreReviewDto, CreateStoreDto, CreateStoreReviewDto, SearchAdminStore, SearchAdminStoreReview, SearchUserStore, UpdateStoreDto, UpdateStoreStatusDto } from './dto/store.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { StoreEntity, StorePublicEntity, StoreReviewEntity, StoreReviewPublicEntity } from './entities/store.entities.js';


@ApiTags('Stores')
@Controller('stores')
export class StoreController {
  constructor(private readonly storeService: StoreService) { }

  @Post()
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Create store (Admin)', description: 'ساخت فروشنده توسط ادمین برای زمانی که کاربر دسترسی ندارد یا توانایی شو ندارد پس از ساخت وضعیت در حالت معلق قرار میگیرد کاربرانی که رول فرشنده یا مربی نیستن اجازه دارن که فروشنده بشن' })
  @ApiBody({ type: CreateStoreDto })
  @ApiResponse({ status: 200, description: 'Store created successfully.' })
  async createStore(@Body() dto: CreateStoreDto) {
    return this.storeService.createStore(dto);
  }

  @Get()
  @ApiOkResponse({ type: PaginatedResponse(StorePublicEntity, 'stores') })
  @ApiOperation({ summary: 'Get stores (Public)', description: 'دریافت تمام فروشندگانی که تایید شدند' })
  @ApiResponse({ status: 200, description: 'Paginated list of stores.' })
  async getStoreUsers(@Query() query: SearchUserStore) {
    return this.storeService.getStoreUsers(query);
  }

  @Get('/admin')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: PaginatedResponse(StoreEntity, 'stores') })
  @ApiOperation({ summary: 'Get stores (Admin)', description: 'Search, filter and sort stores for the admin panel.' })
  @ApiResponse({ status: 200, description: 'Paginated list of stores.' })
  async getStoreAdmin(@Query() query: SearchAdminStore) {
    return this.storeService.getStoreAdmin(query);
  }

  @Get('reviews/:storeId')
  @ApiOperation({ summary: 'Get store review (Public)' })
  @ApiOkResponse({ type: PaginatedResponse(StoreReviewPublicEntity, 'storesReview') })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  async getStoreReview(@Param('storeId') storeId: string, @Query('page') page: string) {
    return this.storeService.getStoreReview(storeId, page);
  }

  @Get('reviews-admin/')
  @UseGuards(AccessTokenGuard)
  @ApiOkResponse({ type: PaginatedResponse(StoreReviewEntity, 'storesReview') })
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Get Admin store review (Admin)' })
  async getStoreReviewAdmin(@Query() query: SearchAdminStoreReview) {
    return this.storeService.getStoreReviewAdmin(query);
  }

  @Get('/:slug')
  @ApiOperation({ summary: 'Get store by slug (Public)' })
  @ApiParam({ name: 'slug', description: 'Store slug' })
  @ApiResponse({ status: 200, description: 'Store information.' })
  @ApiResponse({ status: 404, description: 'Store not found.' })
  async getStore(@Param('slug') slug: string) {
    return this.storeService.getStore(slug);
  }

  @Put(':id')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'STORE')
  @ApiOperation({
    summary: 'Update store (Admin & Store)', description: ` بعضی از اطلاعات رو از نمایش فروشنده بردار موقع آپدیت کردن مثلا کمیسیون تاییدیه و و چیزای دیگه که قکر میکنی ماله ادمین هستش رو از دسترسی فروشنده بردار ولی اکتیو بودن رو بزار فروشنده بتونه تغییر بده`
  })
  @ApiParam({ name: 'id', description: 'Store ID' })
  @ApiBody({ type: UpdateStoreDto })
  async updateStore(@Param('id') id: string, @Body() dto: UpdateStoreDto) {
    return this.storeService.updateStore(id, dto);
  }

  @Post(':storeId/reviews')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: 'Create store review (Users)', description: 'نظرات مختص به فروشگاه هستش و این که هر کس میتونه فقط یه نظر ثبت بکنه نیاز به آپدیت بیشتر داره که بعدا پیاده اش میکنیم فعلا همین کافیه' })
  @ApiParam({ name: 'storeId', description: 'Store ID' })
  @ApiBody({ type: CreateStoreReviewDto })
  async createStoreReview(@CurrentUser('id') userId: string, @Param('storeId') storeId: string, @Body() dto: CreateStoreReviewDto) {
    return this.storeService.createStoreReview(userId, storeId, dto);
  }

  @Put('reviews/:reviewId/approve')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Approve store review (Admin)', description: 'تایید نظرات فروشنده توسط ادمین فروشنده نمیتونه تایید بکنه فقط ادمین میتونه پاسخ بده' })
  @ApiParam({ name: 'reviewId', description: 'Store review ID' })
  async approveStoreReview(@Param('reviewId') reviewId: string) {
    return this.storeService.approveStoreReview(reviewId);
  }

  @Put('reviews/:reviewId/reject')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Reject store review (Admin)', description: 'رد نظرات فروشنده توسط ادمین فروشنده نمیتونه رد بکنه فقط ادمین میتونه پاسخ بده' })
  @ApiParam({ name: 'reviewId', description: 'Store review ID' })
  async rejectStoreReview(@Param('reviewId') reviewId: string) {
    return this.storeService.rejectStoreReview(reviewId);
  }

  @Put('reviews/:reviewId/answer')
  @UseGuards(AccessTokenGuard)
  @Roles('STORE', 'ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Answer store review (Admin,Store)', description: 'پاسخ به نظرات توسط فروشنده و ادمین' })
  @ApiParam({ name: 'reviewId', description: 'Store review ID' })
  @ApiBody({ type: AnswerStoreReviewDto })
  async answerStoreReview(@Param('reviewId') reviewId: string, @Body() dto: AnswerStoreReviewDto) {
    return this.storeService.answerStoreReview(reviewId, dto.answerReview);
  }

  @Delete('reviews/:reviewId')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'Delete store review (Admin)' })
  @ApiParam({ name: 'reviewId', description: 'Store review ID' })
  async deleteStoreReview(@Param('reviewId') reviewId: string) {
    return this.storeService.deleteStoreReview(reviewId);
  }

  @Patch('/:storeId')
  @UseGuards(AccessTokenGuard)
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'Rebuild store review (Super Admin)', description: 'این یه عملیات طولانیه برای محاسبه مجدد اطلاعات و امتیاز های فروشنده برای زمان اضطراری استفاده میشه' })
  @ApiParam({ name: 'storeId', description: 'Store review ID' })
  async RebuildStoreRating(@Param('storeId') storeId: string) {
    return this.storeService.rebuildStoreRating(storeId);
  }
}