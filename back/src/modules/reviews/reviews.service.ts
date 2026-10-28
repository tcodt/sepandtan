import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import {
  CreateReviewDto,
  GetReviewsQueryDto,
  ModerateReviewDto,
  AnswerReviewDto,
  ReviewSearchDto,
} from './dto/review.dto.js';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import pagination from '../../common/utils/pagination.js';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  /**
   * بهینه‌ترین تابع محاسبه و به‌روزرسانی میانگین امتیاز و تعداد نظرات محصول
   * فقط نظرات تاییدشده (isApproved: true) در محاسبه شرکت می‌کنند.
   */
  private async updateProductRating(tx: any, productId: string) {
    const stats = await tx.review.aggregate({
      where: {
        productId,
        isApproved: true,
      },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const averageRating = stats._avg.rating ? Number(stats._avg.rating.toFixed(1)) : 0;
    const reviewCount = stats._count.rating || 0;

    await tx.product.update({
      where: { id: productId },
      data: {
        rating: averageRating,
        reviewCount: reviewCount,
      },
    });
  }

  /**
   * دریافت نظرات تاییدشده یک محصول برای کاربران (عمومی)
   */
  async getProductReviews(productId: string, query: GetReviewsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(this.configService.get('limit.review'))
    // const skip = (page - 2) * limit + 3;
    const skip = (page - 1) * limit;
    const where = {
      productId,
      isApproved: true,
    };
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { body: true, answerReview: true, user: { select: { id: true, name: true } }, rating: true, updatedAt: true },
      }),
      this.prisma.review.count({ where }),
    ]);
    return {
      reviews,
      pagination: pagination(total, page, limit)
    };
  }

  /**
   * ثبت نظر جدید توسط کاربر
   */
  async create(userId: string, dto: CreateReviewDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const review = await tx.review.create({
          data: {
            productId: dto.productId,
            orderId: dto.orderId,
            rating: dto.rating,
            title: dto.title,
            body: dto.body,
            userId,
            isApproved: false,
          },
        });

        if (review.isApproved) {
          await this.updateProductRating(tx, review.productId);
        }

        return review;
      });
    } catch (error) {
      // بررسی ارور Unique Constraint پریزما (کد P2002)
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('شما قبلاً برای این محصول نظر ثبت کرده‌اید');
      }
      throw error;
    }
  }

  /**
   * تایید یا رد نظر توسط ادمین
   */
  async moderateReview(reviewId: string, dto: ModerateReviewDto) {
    const isApprovedBoolean = dto.isApproved;

    await this.prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({
        where: { id: reviewId },
        select: { id: true, productId: true, isApproved: true },
      });
      if (!review) throw new NotFoundException('نظر یافت نشد');
      if (review.isApproved === isApprovedBoolean) {
        return review;
      }
      await tx.review.update({
        where: { id: reviewId },
        data: { isApproved: isApprovedBoolean },
      });
      await this.updateProductRating(tx, review.productId);
    });
    return { success: true }
  }

  /**
   * ثبت/ویرایش پاسخ ادمین به نظر
   */
  async answerReview(reviewId: string, adminId: string, dto: AnswerReviewDto) {
    this.prisma.review.update({
      where: { id: reviewId },
      data: { answerReview: dto.answer },
    });
    return { success: true }
  }

  /**
   * حذف نظر (توسط صاحب نظر یا ادمین)
   */
  async delete(reviewId: string) {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.review.findUnique({
        where: { id: reviewId },
        select: { id: true, userId: true, productId: true, isApproved: true },
      });

      if (!review) throw new NotFoundException('نظر یافت نشد');

      await tx.review.delete({ where: { id: reviewId } });

      // اگر نظر حذف‌شده تاییدشده بود، میانگین مجدداً محاسبه می‌شود
      if (review.isApproved) {
        await this.updateProductRating(tx, review.productId);
      }

      return { message: 'نظر با موفقیت حذف شد' };
    });
  }

  /**
   * دریافت تمام نظرات در پنل ادمین
   */
  async getAllReviewsForAdmin(query: ReviewSearchDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || Number(this.configService.get('limit.reviews'))
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.productId) {
      where.productId = query.productId;
    }

    if (query.isApproved !== undefined && (!query.isApproved || query.isApproved)) {
      where.isApproved = query.isApproved;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, title: true, slug: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: pagination(total, page, limit),
    };
  }

  /**
     * دریافت تمام نظرات در پنل فروشنده
     */
  async getAllReviewsForStore(storeId: string, query: ReviewSearchDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || Number(this.configService.get('limit.reviews'))
    const skip = (page - 1) * limit;

    const where: any = {
      product: {
        storeId: storeId,
      },
    };

    if (query.isApproved !== undefined &&  (query.isApproved || !query.isApproved)) {
      where.isApproved = query.isApproved;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { id: true, title: true, slug: true } },
          user: { select: { id: true, name: true } },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      reviews,
      pagination: pagination(total, page, limit),
    };
  }
}