import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import {
  CreateStoreDto,
  CreateStoreReviewDto,
  SearchAdminStore,
  SearchAdminStoreReview,
  SearchUserStore,
  SortOptionStore,
  UpdateStoreDto,
  UpdateStoreStatusDto,

} from './dto/store.dto.js'
import { PrismaService } from '../../prisma/prisma.service.js'
import { DefaultStatus, Prisma } from '../../generated/prisma/client.js'
import pagination from '../../common/utils/pagination.js'
import { productSelector } from '../products/products.service.js'

@Injectable()
export class StoreService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  private buildStoreOrderBy(
    sortBy: SortOptionStore,
  ): Prisma.StoreOrderByWithRelationInput {
    switch (sortBy) {
      case SortOptionStore.OLDEST:
        return { createdAt: 'asc' }

      case SortOptionStore.NEWEST:
        return { createdAt: 'desc' }

      case SortOptionStore.BEST_SELLING:
        return { rating: { saleCount: 'desc' } }

      case SortOptionStore.BAD_SELLING:
        return { rating: { saleCount: 'asc' } }

      case SortOptionStore.MORE_REVIEWS:
        return { rating: { totalReviews: 'desc' } }

      case SortOptionStore.LOW_REVIEWS:
        return { rating: { totalReviews: 'asc' } }

      case SortOptionStore.MORE_RATE:
        return { rating: { avgRating: 'desc' } }

      case SortOptionStore.LOW_RATE:
        return { rating: { avgRating: 'asc' } }

      case SortOptionStore.MORE_QUALITY:
        return { rating: { productQuality: 'desc' } }

      case SortOptionStore.LOW_QUALITY:
        return { rating: { productQuality: 'asc' } }

      case SortOptionStore.BEST_RESPONSE_RATE:
        return { rating: { responseRate: 'desc' } }

      case SortOptionStore.LOW_RESPONSE_RATE:
        return { rating: { responseRate: 'asc' } }

      case SortOptionStore.LOW_ANSWERED:
        return { rating: { answeredResponses: 'asc' } }

      case SortOptionStore.MORE_PRODUCTS:
        return { rating: { productCount: 'desc' } }

      case SortOptionStore.LOW_PRODUCTS:
        return { rating: { productCount: 'asc' } }

      default:
        return { createdAt: 'desc' }
    }
  }

  async getStoreAdmin(query: SearchAdminStore) {
    const {
      search,
      page = 1,
      sortBy = SortOptionStore.NEWEST,
      isActive,
      isVerified,
      status,
    } = query

    const limit =
      Number(query.limit) ||
      Number(this.configService.get('limit.store'))

    const skip = (page - 1) * limit

    const where: Prisma.StoreWhereInput = {
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      }),
      ...(status !== undefined && { status }),
      ...(isActive !== undefined && { isActive }),
      ...(isVerified !== undefined && { isVerified }),
    }

    const orderBy = this.buildStoreOrderBy(sortBy)

    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          status: true,
          statusReason: true,
          isActive: true,
          isVerified: true,
          businessType: true,
          commissionRate: true,
          province: {
            select: {
              id: true,
              name: true,
            }
          },
          city: {
            select: {
              id: true,
              name: true
            }
          },
          createdAt: true,
          updatedAt: true,
          owner: {
            select: {
              id: true,
              name: true,
            },
          },
          rating: {
            select: {
              avgRating: true,
              totalReviews: true,
              productQuality: true,
              answeredResponses: true,
              totalResponseRequests: true,
              responseRate: true,
              responseTime: true,
              saleCount: true,
              returnCount: true,
            },
          },
        },
      }),
      this.prisma.store.count({ where }),
    ])

    return {
      stores,
      pagination: pagination(total, page, limit),
    }
  }

  async getStoreUsers(query: SearchUserStore) {
    const {
      search,
      page = 1,
      sortBy = SortOptionStore.NEWEST,
      forSelect,
    } = query

    const limit =
      Number(query.limit) ||
      Number(this.configService.get('limit.store'))

    const skip = (page - 1) * limit

    if (forSelect) {
      return this.prisma.store.findMany({
        where: {
          isActive: true,
          status: DefaultStatus.APPROVED,
        },
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      })
    }

    const where: Prisma.StoreWhereInput = {
      status: DefaultStatus.APPROVED,
      isActive: true,
      ...(search && {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          }
        ],
      }),
    }
    const orderBy = this.buildStoreOrderBy(sortBy)
    const [stores, total] = await Promise.all([
      this.prisma.store.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          slug: true,
          banner: true,
          isVerified: true,
          logo: true,
          province: { select: { name: true } },
          city: { select: { name: true } },
          createdAt: true,
          rating: {
            select: {
              avgRating: true,
              totalReviews: true,
              responseRate: true,
              responseTime: true,
              saleCount: true,
              returnCount: true,
            },
          },
        },
      }),

      this.prisma.store.count({ where }),
    ])

    return {
      stores,
      pagination: pagination(total, page, limit),
    }
  }

  async createStore(dto: CreateStoreDto,) {
    try {
      return await this.prisma.store.create({
        data: {
          ...dto,
          userId: dto.userId,
          status: DefaultStatus.PENDING,
          isActive: false,
          isVerified: false,
          rating: {
            create: {},
          },
        },
      })
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'Store owner or slug already exists',
        )
      }

      throw error
    }
  }

  async getStore(slug: string) {    
    const takeReview = Number(this.configService.get('limit.storeReview'))
    const store = await this.prisma.store.findUnique({
      where: { slug },
      select: {
        bale: true, banner: true, businessType: true, description: true, email: true, hasPhysicalStore: true, instagram: true, isActive: true, isVerified: true, createdAt: true,
        logo: true, provinceId: true, cityId: true, id: true, name: true, phone: true, robika: true, slug: true, status: true, telegram: true, workingHours: true, whatsApp: true, shippingTime: true, address: true,
        rating: {
          select: {
            totalReviews: true,
            answeredResponses: true,
            returnCount: true,
            responseTime: true,
            productQuality: true,
            responseRate: true,
            productCount: true,
            saleCount: true,
            updatedAt: true, avgRating: true,
            ratingTotal: true,
          }
        },
        products: {
          select: productSelector,
          take: 6,
          orderBy: {
            createdAt: 'desc',
          },
        },
        storeReview: {
          where: {
            status: DefaultStatus.APPROVED,
          },
          select: {
            user: {
              select: {
                name: true,
              },
            },
            answerAt: true,
            responseAt: true,
            body: true,
            answerReview: true,
            createdAt: true,
            productName: true,
            productQuality: true,
            rating: true,
            verifiedPurchase: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: takeReview,
        },
        province: {
          select: {
            name: true
          }
        },
        city: {
          select: {
            name: true
          }
        },
        _count: {
          select: { storeReview: { where: { status: 'APPROVED' } } }
        }
      },
    })
    if (!store) {
      throw new NotFoundException('Store not found')
    }
    return store
  }

  async updateStore(
    id: string,
    dto: UpdateStoreDto,
  ) {
    return this.prisma.store.update({
      where: { id },
      data: dto,
    })
  }

  // -------------------------------------------------------
  // Store Review
  // -------------------------------------------------------

  async getStoreReviewAdmin(query: SearchAdminStoreReview) {
    const { status, storeId, verifiedPurchase } = query
    const page = Number(query.page || 1)
    const limit = Number(query.limit) || Number(this.configService.get('limit.storeReview'))
    const skip = (page - 1) * limit;
    const where = {
      ...(status && status !== 'All' && { status }),
      ...(verifiedPurchase && { verifiedPurchase: verifiedPurchase }),
      ...(storeId && { storeId }),
    }
    const [review, total] = await Promise.all([
      this.prisma.storeReview.findMany({
        where,
        select: {
          user: {
            select: {
              name: true
            },
          },
          storeId: true,
          store: { select: { slug: true } },
          status: true,
          answerAt: true,
          responseAt: true,
          body: true,
          id: true,
          answerReview: true,
          createdAt: true,
          productName: true,
          productQuality: true,
          rating: true,
          verifiedPurchase: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.storeReview.count({ where }),
    ]);
    return {
      storesReview: review,
      pagination: pagination(total, page, limit)
    }
  }

  async getStoreReview(storeId: string, pageNumber: string) {
    // const page = Number(pageNumber || 1) + 1
    const page = Number(pageNumber || 1)
    const limit = Number(this.configService.get('limit.storeReview'))
    const skip = Number(page - 1) * Number(limit);
    const [review, total] = await Promise.all([
      this.prisma.storeReview.findMany({
        where: {
          storeId: storeId,
          status: 'APPROVED'
        },
        select: {
          user: {
            select: {
              name: true,
            },
          },
          id: true,
          answerAt: true,
          responseAt: true,
          body: true,
          answerReview: true,
          createdAt: true,
          productName: true,
          productQuality: true,
          rating: true,
          verifiedPurchase: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.storeReview.count({ where: { storeId: storeId, status: 'APPROVED' } }),
    ]);
    return {
      storesReview: review,
      pagination: pagination(total, page, limit)
    }
  }

  async createStoreReview(
    userId: string,
    storeId: string,
    dto: CreateStoreReviewDto,
  ) {
    const store = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        status: DefaultStatus.APPROVED,
        isActive: true,
      },
      select: {
        id: true,
      },
    })

    if (!store) {
      throw new NotFoundException(
        'Store not found',
      )
    }

    return this.prisma.storeReview.create({
      data: {
        userId,
        storeId,
        rating: dto.rating,
        body: dto.body,
        productQuality: dto.productQuality,
        status: DefaultStatus.PENDING,
      },
    })
  }

  async approveStoreReview(reviewId: string) {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.storeReview.findUnique({
        where: { id: reviewId },
        select: {
          id: true,
          storeId: true,
          status: true,
          rating: true,
          productQuality: true,
          answerAt: true,
          responseAt: true,
          createdAt: true,
        },
      })

      if (!review) {
        throw new NotFoundException(
          'Store review not found',
        )
      }

      if (review.status === DefaultStatus.APPROVED) {
        return review
      }

      const responseAt =
        review.responseAt ??
        review.answerAt ??
        new Date()

      await this.addReviewRating(tx, {
        storeId: review.storeId,
        rating: review.rating,
        productQuality: review.productQuality,
      })

      await this.addResponseRequest(
        tx,
        review.storeId,
        true,
        this.getResponseTime(
          review.createdAt,
          responseAt,
        ),
      )

      return tx.storeReview.update({
        where: { id: reviewId },
        data: {
          status: DefaultStatus.APPROVED,
          responseAt,
        },
      })
    })
  }

  async rejectStoreReview(reviewId: string) {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.storeReview.findUnique({
        where: { id: reviewId },
        select: {
          id: true,
          storeId: true,
          status: true,
          rating: true,
          productQuality: true,
          responseAt: true,
          createdAt: true,
        },
      })

      if (!review) {
        throw new NotFoundException(
          'Store review not found',
        )
      }

      if (review.status === DefaultStatus.REJECTED) {
        return review
      }

      if (review.status === DefaultStatus.APPROVED) {
        await this.removeReviewRating(tx, {
          storeId: review.storeId,
          rating: review.rating,
          productQuality: review.productQuality,
        })

        const responseTime = review.responseAt
          ? this.getResponseTime(
            review.createdAt,
            review.responseAt,
          )
          : null

        await this.removeResponseRequest(
          tx,
          review.storeId,
          responseTime,
        )
      }

      return tx.storeReview.update({
        where: { id: reviewId },
        data: {
          status: DefaultStatus.REJECTED,
        },
      })
    })
  }

  async answerStoreReview(
    reviewId: string,
    answerReview: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const review = await tx.storeReview.findUnique({
        where: { id: reviewId },
        select: {
          id: true,
          storeId: true,
          status: true,
          answerReview: true,
          answerAt: true,
          responseAt: true,
          rating: true,
          productQuality: true,
          createdAt: true,
        },
      })

      if (!review) {
        throw new NotFoundException(
          'Store review not found',
        )
      }

      if (review.status === DefaultStatus.REJECTED) {
        throw new BadRequestException(
          'Rejected store review cannot be answered',
        )
      }

      if (review.answerReview) {
        throw new BadRequestException(
          'Store review has already been answered',
        )
      }

      const answerAt = new Date()

      if (review.status === DefaultStatus.APPROVED) {
        return tx.storeReview.update({
          where: { id: reviewId },
          data: {
            answerReview,
            answerAt,
          },
        })
      }

      await this.addReviewRating(tx, {
        storeId: review.storeId,
        rating: review.rating,
        productQuality: review.productQuality,
      })

      await this.addResponseRequest(
        tx,
        review.storeId,
        true,
        this.getResponseTime(
          review.createdAt,
          answerAt,
        ),
      )

      return tx.storeReview.update({
        where: { id: reviewId },
        data: {
          answerReview,
          answerAt,
          responseAt: answerAt,
          status: DefaultStatus.APPROVED,
        },
      })
    })
  }

  async deleteStoreReview(reviewId: string) {
    await this.prisma.$transaction(async (tx) => {
      const review = await tx.storeReview.findUnique({
        where: { id: reviewId },
        select: {
          id: true,
          storeId: true,
          status: true,
          rating: true,
          productQuality: true,
          responseAt: true,
          createdAt: true,
        },
      })

      if (!review) {
        throw new NotFoundException('Store review not found')
      }

      if (review.status === DefaultStatus.APPROVED) {
        await this.removeReviewRating(tx, {
          storeId: review.storeId,
          rating: review.rating,
          productQuality: review.productQuality,
        })

        const responseTime = review.responseAt
          ? this.getResponseTime(
            review.createdAt,
            review.responseAt,
          )
          : null

        await this.removeResponseRequest(
          tx,
          review.storeId,
          responseTime,
        )
      }

      return tx.storeReview.delete({
        where: { id: reviewId },
      })
    })
    return { success: true }
  }

  // -------------------------------------------------------
  // Rating - Response
  // -------------------------------------------------------

  private async addResponseRequest(
    tx: Prisma.TransactionClient,
    storeId: string,
    answered: boolean,
    responseTime = 0,
  ) {
    const rating = await tx.storeRating.update({
      where: { storeId },
      data: {
        totalResponseRequests: {
          increment: 1,
        },

        ...(answered && {
          answeredResponses: {
            increment: 1,
          },
          totalResponseTime: {
            increment: responseTime,
          },
        }),
      },
      select: {
        totalResponseRequests: true,
        answeredResponses: true,
        totalResponseTime: true,
      },
    })

    await this.updateResponseValues(
      tx,
      storeId,
      rating,
    )
  }

  private async removeResponseRequest(
    tx: Prisma.TransactionClient,
    storeId: string,
    responseTime: number | null,
  ) {
    const rating = await tx.storeRating.update({
      where: { storeId },
      data: {
        totalResponseRequests: {
          decrement: 1,
        },

        ...(responseTime !== null && {
          answeredResponses: {
            decrement: 1,
          },
          totalResponseTime: {
            decrement: responseTime,
          },
        }),
      },
      select: {
        totalResponseRequests: true,
        answeredResponses: true,
        totalResponseTime: true,
      },
    })

    await this.updateResponseValues(
      tx,
      storeId,
      rating,
    )
  }

  private async updateResponseValues(
    tx: Prisma.TransactionClient | PrismaService,
    storeId: string,
    data: {
      totalResponseRequests: number
      answeredResponses: number
      totalResponseTime: number
    },
  ) {
    const responseRate =
      data.totalResponseRequests > 0
        ? (data.answeredResponses /
          data.totalResponseRequests) *
        100
        : 100

    const responseTime =
      data.answeredResponses > 0
        ? data.totalResponseTime /
        data.answeredResponses
        : 0

    await tx.storeRating.update({
      where: { storeId },
      data: {
        responseRate,
        responseTime,
      },
    })
  }

  // -------------------------------------------------------
  // Rating - Review
  // -------------------------------------------------------

  private async addReviewRating(
    tx: Prisma.TransactionClient,
    review: {
      storeId: string
      rating: number
      productQuality: number | null
    },
  ) {
    const rating = await tx.storeRating.update({
      where: {
        storeId: review.storeId,
      },
      data: {
        ratingTotal: {
          increment: review.rating,
        },
        totalReviews: {
          increment: 1,
        },
        ...(review.productQuality !== null && {
          productQualityTotal: {
            increment: review.productQuality,
          },
          productQualityCount: {
            increment: 1,
          },
        }),
      },
      select: {
        ratingTotal: true,
        totalReviews: true,
        productQualityTotal: true,
        productQualityCount: true,
        productQuality: true,
      },
    })

    const avgRating =
      rating.totalReviews > 0
        ? rating.ratingTotal /
        rating.totalReviews
        : 0

    const productQuality =
      rating.productQualityCount > 0
        ? rating.productQualityTotal /
        rating.productQualityCount
        : 5

    await tx.storeRating.update({
      where: {
        storeId: review.storeId,
      },
      data: {
        avgRating,
        productQuality,
      },
    })
  }

  private async removeReviewRating(
    tx: Prisma.TransactionClient,
    review: {
      storeId: string
      rating: number
      productQuality: number | null
    },
  ) {
    const rating = await tx.storeRating.update({
      where: {
        storeId: review.storeId,
      },
      data: {
        ratingTotal: {
          decrement: review.rating,
        },
        totalReviews: {
          decrement: 1,
        },

        ...(review.productQuality !== null && {
          productQualityTotal: {
            decrement: review.productQuality,
          },
          productQualityCount: {
            decrement: 1,
          },
        }),
      },
      select: {
        ratingTotal: true,
        totalReviews: true,
        productQualityTotal: true,
        productQualityCount: true,
      },
    })

    const avgRating =
      rating.totalReviews > 0
        ? rating.ratingTotal /
        rating.totalReviews
        : 0

    const productQuality =
      rating.productQualityCount > 0
        ? rating.productQualityTotal /
        rating.productQualityCount
        : 5

    await tx.storeRating.update({
      where: {
        storeId: review.storeId,
      },
      data: {
        avgRating,
        productQuality,
      },
    })
  }

  private getResponseTime(
    createdAt: Date,
    responseAt: Date,
  ): number {
    return Math.max(
      0,
      (responseAt.getTime() -
        createdAt.getTime()) /
      60000,
    )
  }

  // -------------------------------------------------------
  // Rating - Product
  // -------------------------------------------------------
  // if (
  //   oldStatus !== ProductStatus.APPROVED &&
  //   newStatus === ProductStatus.APPROVED &&
  //   product.storeId
  // ) {
  //   await this.storeService.incrementProductCount(
  //     product.storeId,
  //   )
  // }
  async incrementProductCount(
    storeId: string,
  ) {
    return this.prisma.storeRating.update({
      where: { storeId },
      data: {
        productCount: {
          increment: 1,
        },
      },
    })
  }
  //   if (
  //   oldStatus === ProductStatus.APPROVED &&
  //   newStatus !== ProductStatus.APPROVED &&
  //   product.storeId
  // ) {
  //   await this.storeService.decrementProductCount(
  //     product.storeId,
  //   )
  // }
  async decrementProductCount(
    storeId: string,
  ) {
    return this.prisma.storeRating.update({
      where: { storeId },
      data: {
        productCount: {
          decrement: 1,
        },
      },
    })
  }
  // -------------------------------------------------------
  // Rating - Sale / Return
  // -------------------------------------------------------
  // await this.storeService.incrementSaleCount(
  //   orderItem.storeId,
  //   orderItem.quantity,
  // )
  async incrementSaleCount(
    storeId: string,
    quantity: number,
  ) {
    if (quantity <= 0) return

    return this.prisma.storeRating.update({
      where: { storeId },
      data: {
        saleCount: {
          increment: quantity,
        },
      },
    })
  }
  // await this.storeService.registerReturn(
  //   orderItem.storeId,
  //   returnItem.quantity,
  // )
  async registerReturn(
    storeId: string,
    quantity: number,
  ) {
    if (quantity <= 0) return

    return this.prisma.storeRating.update({
      where: { storeId },
      data: {
        saleCount: {
          decrement: quantity,
        },
        returnCount: {
          increment: quantity,
        },
      },
    })
  }

  async rebuildStoreRating(storeId: string) {
    return this.prisma.$transaction(async (tx) => {
      const [
        productCount,
        reviewStats,
        orderStats,
        reviewResponseStats,
        qnaResponseStats,
      ] = await Promise.all([
        // 1. تعداد محصولات APPROVED
        tx.product.count({
          where: {
            storeId,
            status: 'ACTIVE',
          },
        }),

        // 2. آمار Reviewهای APPROVED
        tx.storeReview.aggregate({
          where: {
            storeId,
            status: DefaultStatus.APPROVED,
          },
          _count: {
            _all: true,
          },
          _sum: {
            rating: true,
            productQuality: true,
          },
        }),

        // 3. آمار فروش و مرجوعی
        tx.orderItem.aggregate({
          where: {
            storeId,
            order: {
              checkout: {
                paymentStatus: 'PAID',
              },
              status: {
                not: 'CANCELLED',
              },
            },
          },
          _sum: {
            quantity: true,
            returnedQty: true,
          },
        }),

        // 4. Response Statistics مربوط به Review
        tx.$queryRaw<{
          totalRequests: number
          answered: number
          totalResponseTime: number
        }[]>`
        SELECT
          COUNT(*)::int AS "totalRequests",

          COUNT("response_at")::int AS "answered",

          COALESCE(
            SUM(
              CASE
                WHEN "response_at" IS NOT NULL
                THEN EXTRACT(
                  EPOCH FROM (
                    "response_at" - "created_at"
                  )
                ) / 60
                ELSE 0
              END
            ),
            0
          )::float8 AS "totalResponseTime"

        FROM "store_reviews"

        WHERE
          "store_id" = ${storeId}
          AND "status" = 'APPROVED'
      `,

        // 5. Response Statistics مربوط به Qna
        tx.$queryRaw<{
          totalRequests: number
          answered: number
          totalResponseTime: number
        }[]>`
        SELECT
          COUNT(*)::int AS "totalRequests",

          COUNT(reply.id)::int AS "answered",

          COALESCE(
            SUM(
              CASE
                WHEN reply.id IS NOT NULL
                THEN EXTRACT(
                  EPOCH FROM (
                    reply."createdAt" - question."createdAt"
                  )
                ) / 60
                ELSE 0
              END
            ),
            0
          )::float8 AS "totalResponseTime"

        FROM "Qna" question

        INNER JOIN "products" product
          ON product.id = question."productId"

        LEFT JOIN LATERAL (
          SELECT
            reply.id,
            reply."createdAt"
          FROM "Qna" reply
          WHERE
            reply."parentId" = question.id
            AND reply.role = 'STORE'
          ORDER BY reply."createdAt" ASC
          LIMIT 1
        ) reply ON true

        WHERE
          question."parentId" IS NULL
          AND question.status = 'APPROVED'
          AND product."store_id" = ${storeId}
      `,
      ])

      const reviewResponse = reviewResponseStats[0]
      const qnaResponse = qnaResponseStats[0]

      // -------------------------------------------------------
      // Review Rating
      // -------------------------------------------------------

      const totalReviews = reviewStats._count._all
      const ratingTotal =
        reviewStats._sum.rating ?? 0
      const avgRating =
        totalReviews > 0
          ? ratingTotal / totalReviews
          : 0
      const productQualityCount =
        await tx.storeReview.count({
          where: {
            storeId,
            status: DefaultStatus.APPROVED,
            productQuality: {
              not: null,
            },
          },
        })
      const productQualityTotal =
        reviewStats._sum.productQuality ?? 0
      const productQuality =
        productQualityCount > 0
          ? productQualityTotal / productQualityCount
          : 5
      const totalResponseRequests =
        Number(reviewResponse.totalRequests) +
        Number(qnaResponse.totalRequests)
      const answeredResponses =
        Number(reviewResponse.answered) +
        Number(qnaResponse.answered)
      const totalResponseTime =
        Number(reviewResponse.totalResponseTime) +
        Number(qnaResponse.totalResponseTime)
      const responseRate =
        totalResponseRequests > 0
          ? (answeredResponses /
            totalResponseRequests) *
          100
          : 100
      const responseTime =
        answeredResponses > 0
          ? totalResponseTime /
          answeredResponses
          : 0
      const totalQuantity =
        orderStats._sum.quantity ?? 0
      const returnedQuantity =
        orderStats._sum.returnedQty ?? 0
      const saleCount = Math.max(
        0,
        totalQuantity - returnedQuantity,
      )
      const returnCount = Math.max(
        0,
        returnedQuantity,
      )
      return tx.storeRating.update({
        where: {
          storeId,
        },
        data: {
          avgRating,
          ratingTotal,
          totalReviews,

          productCount,

          productQuality,
          productQualityTotal,
          productQualityCount,

          totalResponseRequests,
          answeredResponses,
          totalResponseTime,
          responseRate,
          responseTime,

          saleCount,
          returnCount,

          // فعلاً دست نخورده:
          // communication
          // onTimeDelivery
        },
      })
    })
  }
}