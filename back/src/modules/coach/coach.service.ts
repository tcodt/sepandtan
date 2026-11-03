import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import { ApprovedCoachReviewDto, CreateCoachDto, CreateCoachReviewDto, SearchAdminCoachDto, SearchCoachDto, SearchCoachReview, SortOptionCoach, UpdateCoachDto, UpdateCoachReviewDto } from './dto/coach.dto.js';
import { Prisma, RolePerson } from '../../generated/prisma/client.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';

@Injectable()
export class CoachService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  private buildCoachOrderBy(
    sortBy: SortOptionCoach,
  ): Prisma.CoachOrderByWithRelationInput {
    switch (sortBy) {
      case SortOptionCoach.OLDEST:
        return { createdAt: 'asc' }

      case SortOptionCoach.NEWEST:
        return { createdAt: 'desc' }

      case SortOptionCoach.MORE_SELLING:
        return {
          coachRating: {
            completedClients: 'desc'
          }
        }

      case SortOptionCoach.LOW_SELLING:
        return {
          coachRating: {
            completedClients: 'asc'
          }
        }

      case SortOptionCoach.MORE_REVIEWS:
        return {
          coachRating: {
            totalReviews: 'desc'
          }
        }

      case SortOptionCoach.LOW_REVIEWS:
        return {
          coachRating: {
            totalReviews: 'asc'
          }
        }

      case SortOptionCoach.MORE_RATE:
        return {
          coachRating: {
            avgCoachRating: 'desc'
          }
        }

      case SortOptionCoach.LOW_RATE:
        return {
          coachRating: {
            avgCoachRating: 'asc'
          }
        }

      default:
        return { createdAt: 'desc' }
    }
  }

  async findAll(query: SearchCoachDto) {
    const { cityId, isAcceptingClients, limit, sortBy, page = 1, provinceId, search } = query
    const limitPage = Number(limit) || Number(this.configService.get('limit.coach'))
    const skip = (Number(page) - 1) * limitPage;

    const where: Prisma.CoachWhereInput = {
      ...(search && {
        OR: [
          { headline: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(isAcceptingClients !== undefined && { isAcceptingClients }),
      ...(cityId && { cityId }),
      ...(provinceId && { provinceId }),
      status: 'APPROVED'
    }
    const orderBy = this.buildCoachOrderBy(sortBy ?? SortOptionCoach.NEWEST)

    const [data, count] = await Promise.all([
      this.prisma.coach.findMany({
        where,
        select: {
          coachRating: {
            select: {
              avgCoachRating: true,
              totalReviews: true,
              completedClients: true,
              avgPlanRating: true,
              activeClients: true
            },
          },
          city: {
            select: { name: true, id: true }
          },
          province: {
            select: { name: true, id: true }
          },
          id: true,
          title: true,
          slug: true,
          headline: true,
          bio: true,
          isAcceptingClients: true,
        },
        orderBy: orderBy,
        skip,
        take: limitPage,
      }),
      this.prisma.coach.count({ where })
    ])

    return {
      coach: data,
      pagination: pagination(count, page, limitPage)
    }
  }

  async getForSelector() {
    return this.prisma.coach.findMany({
      where: { status: 'APPROVED' },
      select: {
        title: true,
        slug: true,
        id: true,
      },
      take: 100,
      orderBy: { title: 'desc' }
    })
  }

  async findAllAdmin(query: SearchAdminCoachDto) {
    const { limit, order, page = 1, cityId, isAcceptingClients, status, provinceId, search, sortBy } = query
    const limitPage = Number(limit) || Number(this.configService.get('limit.coach'))
    const skip = (Number(page) - 1) * limitPage;

    const where: Prisma.CoachWhereInput = {
      ...(search && {
        OR: [
          { headline: { contains: search, mode: 'insensitive' } },
          { title: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(isAcceptingClients !== undefined && { isAcceptingClients }),
      ...(cityId && { cityId }),
      ...(provinceId && { provinceId }),
      ...(status && status !== 'ALL' && { status })
    }
    const orderBy = this.buildCoachOrderBy(sortBy ?? SortOptionCoach.NEWEST)

    const [data, count] = await Promise.all([
      this.prisma.coach.findMany({
        where,
        select: {
          city: {
            select: { name: true, id: true }
          },
          province: {
            select: { name: true, id: true }
          },
          id: true,
          title: true,
          slug: true,
          headline: true,
          bio: true,
          isAcceptingClients: true,
        },
        orderBy: orderBy,
        skip,
        take: limitPage,
      }),
      this.prisma.coach.count({ where })
    ])

    return {
      coach: data,
      pagination: pagination(count, page, limitPage)
    }
  }

  // for Admin
  async findById(id: string) {
    return this.prisma.coach.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            dietPlans: true,
            planRequests: true,
            workoutPlans: true,
            userPlans: true,
            certifications: true,
            availabilities: true,
            coachAchievements: true,
            specialties: true
          }
        },
        coachRating: true,
        city: { select: { name: true } },
        province: { select: { name: true } },
        user: { select: { name: true, phone: true, id: true } },
      }
    })
  }

  async findBySlug(slug: string) {
    return this.prisma.coach.findUnique({
      where: { slug, status: 'APPROVED' },
      select: {
        id: true,
        title: true,
        slug: true,
        headline: true,
        bio: true,
        instagram: true,
        isAcceptingClients: true,
        maxClients: true,
        city: { select: { name: true } },
        province: { select: { name: true } },
        address: {
          select: {
            id: true,
            address: true,
            phone: true
          }
        },
        coachRating: {
          select: {
            id: true,
            avgDietRating: true,
            activeClients: true,
            avgCoachRating: true,
            completedClients: true,
            totalReviews: true,
            avgPlanRating: true,
          }
        },
        reviews: {
          where: { status: 'APPROVED' },
          select: {
            body: true,
            id: true,
            isAnonymous: true,
            images: true,
            createdAt: true,
            answerReview: true,
            coachRating: true,
            planRating: true,
            dietRating: true,
            isVerified: true,
            likeCount: true,
            dislikeCount: true,
            author: {
              select: {
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        specialties: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            slug: true,
            title: true,
          }
        },
        availabilities: {
          select: {
            id: true,
            weekday: true,
            startTime: true,
            endTime: true,
          }
        },
        coachAchievements: {
          take: 2,
          where: { isVerified: true },
          select: {
            id: true,
            title: true,
            type: true,
            scope: true,
            issuer: true,
            place: true,
            year: true,
            eventName: true,
            description: true,
            documentUrl: true,
            sortOrder: true,
          },
          orderBy: { createdAt: 'desc' }
        },
        certifications: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          where: { status: 'APPROVED', isPrimary: true },
          select: {
            type: true,
            title: true,
            level: true,
            field: true,
            issuer: true,
            documentUrl: true,
          }
        },
        workoutPlans: {
          take: 2,
          orderBy: { avgRating: 'desc' },
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            coverImage: true,
            description: true,
            price: true,
            discountPrice: true,
            minAge: true,
            maxAge: true,
            note: true,
            avgRating: true,
            durationWeeks: true,
            gender: true,
            trainingLocation: true,
            activityLevel: true,
            experienceLevel: true,
            discountExpired: true,
          }
        },
        dietPlans: {
          take: 2,
          orderBy: { avgRating: 'desc' },
          where: { isPublished: true },
          select: {
            id: true,
            title: true,
            description: true,
            price: true,
            discountPrice: true,
            countRating: true,
            totalRating: true,
            coverImage: true,
            avgRating: true,
            source: true,
            targetCalories: true,
            targetProteinG: true,
            targetCarbsG: true,
            targetFatG: true,
            durationWeeks: true,
            discountExpired: true,
          }
        }
      }
    })
  }

  async create(dto: CreateCoachDto) {
    await this.prisma.coach.create({
      data: {
        ...dto,
        coachRating: {
          create: {}
        },
      },
    });
    return { success: true }
  }

  async update(id: string, dto: UpdateCoachDto, role: RolePerson, userId: string) {
    if (role === 'SUPERADMIN' || role === 'ADMIN') {
      await this.prisma.coach.update({ where: { id }, data: { ...dto } })
    }
    if (role === 'COACH' && id === userId) {
      const { status, commissionRate, rejectionReason, title, slug, ...body } = dto
      await this.prisma.coach.update({ where: { id }, data: { ...body } })
    }
    return { success: true }
  }

  async delete(id: string) {
    await this.prisma.coach.update({ where: { id }, data: { status: 'DELETED' } })
    return { success: true }
  }
}
