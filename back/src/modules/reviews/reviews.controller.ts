import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service.js';
import {
  CreateReviewDto,
  GetReviewsQueryDto,
  ModerateReviewDto,
  AnswerReviewDto,
} from './dto/review.dto.js';
import { ReviewSearchDto } from './dto/review.search.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { ProductReviewEntity, ReviewEntity } from './entities/review.entity.js';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) { }

  @Get('product/:productId')
  @ApiOperation({ summary: 'دریافت نظرات تایید شده یک محصول (Public)', description: 'آیدی محصول رو بفرست' })
  @ApiOkResponse({ type: PaginatedResponse(ProductReviewEntity, 'reviews') })
  async getProductReviews(@Param('productId') productId: string, @Query() query: GetReviewsQueryDto,) {
    return this.reviewsService.getProductReviews(productId, query);
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  @ApiOperation({ summary: 'ثبت نظر جدید توسط کاربر (User)', description: 'اون بخش بادی رو مشخص نیست چکارش کنیم ولی فعلا باشه شاید بعدا مزایا و معایب محصول رو گذاشتیم توش ... ' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateReviewDto) {
    return this.reviewsService.create(userId, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'STORE')
  @Patch(':id/moderate')
  @ApiOperation({ summary: 'تایید یا رد نظر (Admin & Store)' })
  async moderate(@Param('id') id: string, @Body() dto: ModerateReviewDto) {
    return this.reviewsService.moderateReview(id, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'STORE')
  @Post(':id/answer')
  @ApiOperation({ summary: 'پاسخ به نظر (Admin & Store)' })
  async answer(
    @Param('id') id: string,
    @CurrentUser('id') adminId: string,
    @Body() dto: AnswerReviewDto,
  ) {
    return this.reviewsService.answerReview(id, adminId, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'حذف نظر (Admin)' })
  async delete(@Param('id') id: string) {
    return this.reviewsService.delete(id);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get('admin/all')
  @ApiOkResponse({ type: PaginatedResponse(ReviewEntity, 'reviews') })
  @ApiOperation({ summary: 'دریافت تمام نظرات برای پنل ادمین (Admin)' })
  async getAllForAdmin(@Query() query: ReviewSearchDto) {
    return this.reviewsService.getAllReviewsForAdmin(query);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('STORE')
  @Get('store/:storeId')
  @ApiOkResponse({ type: PaginatedResponse(ReviewEntity, 'reviews') })
  @ApiOperation({ summary: 'دریافت نظرات مربوط به محصولات فروشنده جاری (Store)', description: 'آیدی فروشگاه رو ارسال بکن  به صورت پیش فرض تا نظرات محصولات خودش رو ببینه ' })
  async getSellerReviews(
    @Param('storeId') storeId: string,
    @Query() query: ReviewSearchDto,
  ) {
    return this.reviewsService.getAllReviewsForStore(storeId, query);
  }
}