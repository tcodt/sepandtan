import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { ConfigService } from '@nestjs/config';
import pagination from '../../common/utils/pagination.js';
import { Prisma } from '../../generated/prisma/client.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import { ApprovedCoachReviewDto, CreateCoachReviewDto, SearchCoachReview, UpdateCoachReviewDto } from './dto/coach.dto.js';

@Injectable()
export class ReviewCoachService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) { }

    private toDec(n: number) {
        return new Prisma.Decimal(n.toFixed(2));
    }

    private recalcAvgs(totalReviews: number, coachTotal: number, planTotal: number, dietTotal: number) {
        const avg = (total: number) => totalReviews > 0 ? Number((total / totalReviews).toFixed(2)) : 0;
        return {
            avgCoachRating: avg(coachTotal),
            avgPlanRating: avg(planTotal),
            avgDietRating: avg(dietTotal),
        };
    }

    private async applyReviewAggregates(
        tx: Prisma.TransactionClient,
        review: {
            coachId: string;
            coachRating: number;
            planRating: number;
            dietRating: number;
            userPlanId: string | null;
        },
        direction: 'add' | 'remove',
    ) {
        const sign = direction === 'add' ? 1 : -1;
        const coachInc = sign * review.coachRating;
        const planInc = sign * review.planRating;
        const dietInc = sign * review.dietRating;
        const reviewInc = sign * 1;

        const rating = await tx.coachRating.update({
            where: { coachId: review.coachId },
            data: {
                coachRatingTotal: { increment: coachInc },
                planRatingTotal: { increment: planInc },
                dietRatingTotal: { increment: dietInc },
                totalReviews: { increment: reviewInc },
            },
            select: {
                coachRatingTotal: true,
                planRatingTotal: true,
                dietRatingTotal: true,
                totalReviews: true,
            },
        });

        const totalReviews = Math.max(0, rating.totalReviews);
        const coachTotal = Math.max(0, Number(rating.coachRatingTotal));
        const planTotal = Math.max(0, Number(rating.planRatingTotal));
        const dietTotal = Math.max(0, Number(rating.dietRatingTotal));

        await tx.coachRating.update({
            where: { coachId: review.coachId },
            data: {
                totalReviews,
                coachRatingTotal: coachTotal,
                planRatingTotal: planTotal,
                dietRatingTotal: dietTotal,
                ...this.recalcAvgs(totalReviews, coachTotal, planTotal, dietTotal),
            },
        });
        // امتیاز روی خود قالب‌ها (اگر به userPlan وصل است)
        if (!review.userPlanId) return;

        const userPlan = await tx.userPlan.findUnique({
            where: { id: review.userPlanId },
            select: {
                workoutPlanId: true,
                dietPlanId: true,
            },
        });
        if (!userPlan) return;

        if (userPlan.workoutPlanId) {
            await this.applyPlanTemplateRating(tx, {
                type: 'workout',
                planId: userPlan.workoutPlanId,
                stars: review.planRating,
                direction,
            });
        }
        if (userPlan.dietPlanId) {
            await this.applyPlanTemplateRating(tx, {
                type: 'diet',
                planId: userPlan.dietPlanId,
                stars: review.dietRating,
                direction,
            });
        }
    }

    private async applyPlanTemplateRating(
        tx: Prisma.TransactionClient,
        args: {
            type: 'workout' | 'diet';
            planId: string;
            stars: number;
            direction: 'add' | 'remove';
        },
    ) {
        const sign = args.direction === 'add' ? 1 : -1;
        const incStars = sign * args.stars;
        const incCount = sign * 1;

        if (args.type === 'workout') {
            const row = await tx.workoutPlan.update({
                where: { id: args.planId },
                data: {
                    totalRating: { increment: incStars },
                    countRating: { increment: incCount },
                },
                select: { totalRating: true, countRating: true },
            });
            const count = Math.max(0, row.countRating);
            const total = Math.max(0, row.totalRating);
            await tx.workoutPlan.update({
                where: { id: args.planId },
                data: {
                    countRating: count,
                    totalRating: total,
                    avgRating: this.toDec(count > 0 ? total / count : 0),
                },
            });
            return;
        }

        const row = await tx.dietPlan.update({
            where: { id: args.planId },
            data: {
                totalRating: { increment: incStars },
                countRating: { increment: incCount },
            },
            select: { totalRating: true, countRating: true },
        });
        const count = Math.max(0, row.countRating);
        const total = Math.max(0, row.totalRating);
        await tx.dietPlan.update({
            where: { id: args.planId },
            data: {
                countRating: count,
                totalRating: total,
                avgRating: this.toDec(count > 0 ? total / count : 0),
            },
        });
    }

    private async transitionReviewStatus(
        tx: Prisma.TransactionClient,
        review: {
            id: string;
            status: string;
            coachId: string;
            coachRating: number;
            planRating: number;
            dietRating: number;
            userPlanId: string | null;
        },
        next: 'PENDING' | 'APPROVED' | 'REJECTED',
    ) {
        if (review.status === next) {
            return review;
        }

        const wasApproved = review.status === 'APPROVED';
        const willApprove = next === 'APPROVED';

        if (!wasApproved && willApprove) {
            await this.applyReviewAggregates(tx, review, 'add');
        } else if (wasApproved && !willApprove) {
            await this.applyReviewAggregates(tx, review, 'remove');
        }

        return tx.coachReview.update({
            where: { id: review.id },
            data: { status: next },
        });
    }

    async addReviewCoach(userId: string, dto: CreateCoachReviewDto) {
        for (const [key, val] of [
            ['coachRating', dto.coachRating],
            ['planRating', dto.planRating],
            ['dietRating', dto.dietRating],
        ] as const) {
            if (!Number.isInteger(val) || val < 1 || val > 5) {
                throw new BadRequestException(`${key} باید عدد صحیح بین ۱ تا ۵ باشد`);
            }
        }

        const coach = await this.prisma.coach.findFirst({
            where: { id: dto.coachId, status: 'APPROVED' },
            select: { id: true },
        });
        if (!coach) throw new NotFoundException('مربی یافت نشد');

        let isVerified = false;
        if (dto.userPlanId) {
            const plan = await this.prisma.userPlan.findFirst({
                where: {
                    id: dto.userPlanId,
                    userId,
                    coachId: dto.coachId,
                },
                select: { id: true },
            });
            if (!plan) {
                throw new BadRequestException('برنامه کاربری معتبر برای این مربی یافت نشد');
            }
            isVerified = true;
        }

        try {
            await this.prisma.coachReview.create({
                data: {
                    coachId: dto.coachId,
                    authorId: userId,
                    userPlanId: dto.userPlanId ?? null,
                    coachRating: dto.coachRating,
                    planRating: dto.planRating,
                    dietRating: dto.dietRating,
                    body: dto.body,
                    images: dto.images ?? [],
                    isAnonymous: dto.isAnonymous ?? false,
                    isVerified,
                    status: 'PENDING',
                },
            });
        } catch (e) {
            if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
                throw new ConflictException('شما قبلاً برای این مربی نظر ثبت کرده‌اید');
            }
            throw e;
        }

        return { success: true };
    }

    async getReviewCoach(coachId: string, query: QueryDefaultDto) {
        const page = Number(query.page) || 1;
        const limitPage =
            Number(query.limit) || Number(this.configService.get('limit.coach')) || 10;
        const skip = (page - 1) * limitPage;

        const where: Prisma.CoachReviewWhereInput = {
            coachId,
            status: 'APPROVED',
        };

        const [rows, count] = await Promise.all([
            this.prisma.coachReview.findMany({
                where,
                select: {
                    id: true,
                    body: true,
                    images: true,
                    createdAt: true,
                    answerReview: true,
                    answeredAt: true,
                    coachRating: true,
                    planRating: true,
                    dietRating: true,
                    isAnonymous: true,
                    isVerified: true,
                    likeCount: true,
                    dislikeCount: true,
                    author: {
                        select: {
                            name: true,
                            avatar: true
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitPage,
            }),
            this.prisma.coachReview.count({ where }),
        ]);

        const data = rows.map((r) => ({
            ...r,
            author: r.isAnonymous ? null : r.author,
        }));

        return {
            reviews: data,
            pagination: pagination(count, page, limitPage),
        };
    }

    async getAllReviewCoach(query: SearchCoachReview) {
        if (!query.coachId) throw new NotFoundException('لطفا آیدی مربی را ارسال کنید')
        const { page, id, limit, order, status } = query
        const limitPage = Number(limit) || Number(this.configService.get('limit.coach')) || 10;
        const skip = (Number(page) - 1) * limitPage;

        const where: Prisma.CoachReviewWhereInput = {
            coachId: query.coachId,
            ...(status && status !== 'ALL' && { status }),
            ...(id && { id })
        };

        const [rows, count] = await Promise.all([
            this.prisma.coachReview.findMany({
                where,
                select: {
                    id: true,
                    body: true,
                    images: true,
                    createdAt: true,
                    answerReview: true,
                    answeredAt: true,
                    coachRating: true,
                    planRating: true,
                    dietRating: true,
                    isAnonymous: true,
                    isVerified: true,
                    likeCount: true,
                    dislikeCount: true,
                    author: {
                        select: {
                            name: true,
                            avatar: true
                        },
                    },
                },
                orderBy: { createdAt: order },
                skip,
                take: limitPage,
            }),
            this.prisma.coachReview.count({ where }),
        ]);

        const data = rows.map((r) => ({
            ...r,
            author: r.isAnonymous ? null : r.author,
        }));

        return {
            reviews: data,
            pagination: pagination(count, Number(page), limitPage),
        };
    }

    async getAdminAllReviewCoach(query: SearchCoachReview) {
        const { coachId, limit, order, page = 1, status, id } = query
        const limitPage = Number(limit) || Number(this.configService.get('limit.coach')) || 10;
        const skip = (page - 1) * limitPage;

        const where: Prisma.CoachReviewWhereInput = {
            ...(coachId && { coachId }),
            ...(status && status !== 'ALL' && { status }),
            ...(id && { id })
        };

        const [rows, count] = await Promise.all([
            this.prisma.coachReview.findMany({
                where,
                select: {
                    id: true,
                    body: true,
                    images: true,
                    status: true,
                    createdAt: true,
                    coachRating: true,
                    planRating: true,
                    dietRating: true,
                    isAnonymous: true,
                    isVerified: true,
                    likeCount: true,
                    dislikeCount: true,
                    coach: { select: { id: true, title: true, slug: true } },
                    author: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: order },
                skip,
                take: limitPage,
            }),
            this.prisma.coachReview.count({ where }),
        ]);

        return {
            reviews: rows,
            pagination: pagination(count, page, limitPage),
        };
    }

    async approveReviewCoach(reviewId: string, body: ApprovedCoachReviewDto) {
        return this.prisma.$transaction(async (tx) => {
            const review = await tx.coachReview.findUnique({
                where: { id: reviewId },
                select: {
                    id: true,
                    status: true,
                    coachId: true,
                    coachRating: true,
                    planRating: true,
                    dietRating: true,
                    userPlanId: true,
                },
            });
            if (!review) throw new NotFoundException('نظر یافت نشد');
            if (body.answerReview) {
                await tx.coachReview.update({ where: { id: reviewId }, data: { answerReview: body.answerReview, answeredAt: new Date() } })
            }
            await this.transitionReviewStatus(tx, review, 'APPROVED');
            return { success: true };
        });
    }

    async updateStatusCoach(reviewId: string, body: UpdateCoachReviewDto) {
        const { status } = body
        if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
            throw new BadRequestException('وضعیت نامعتبر است');
        }

        return this.prisma.$transaction(async (tx) => {
            const review = await tx.coachReview.findUnique({
                where: { id: reviewId },
                select: {
                    id: true,
                    status: true,
                    coachId: true,
                    coachRating: true,
                    planRating: true,
                    dietRating: true,
                    userPlanId: true,
                },
            });
            if (!review) throw new NotFoundException('نظر یافت نشد');

            await this.transitionReviewStatus(tx, review, status);
            return { success: true };
        });
    }

    async deleteReviewCoach(reviewId: string) {
        return this.prisma.$transaction(async (tx) => {
            const review = await tx.coachReview.findUnique({
                where: { id: reviewId },
                select: {
                    id: true,
                    status: true,
                    coachId: true,
                    coachRating: true,
                    planRating: true,
                    dietRating: true,
                    userPlanId: true,
                },
            });
            if (!review) throw new NotFoundException('نظر یافت نشد');

            // اگر تأییدشده بود اول از میانگین‌ها کم کن
            if (review.status === 'APPROVED') {
                await this.applyReviewAggregates(tx, review, 'remove');
            }

            await tx.coachReview.delete({ where: { id: reviewId } });
            return { success: true };
        });
    }

    async rebuildCoachRating(coachId: string) {
        return this.prisma.$transaction(async (tx) => {
            const stats = await tx.coachReview.aggregate({
                where: { coachId, status: 'APPROVED' },
                _count: { _all: true },
                _sum: {
                    coachRating: true,
                    planRating: true,
                    dietRating: true,
                },
            });

            const totalReviews = stats._count._all;
            const coachTotal = stats._sum.coachRating ?? 0;
            const planTotal = stats._sum.planRating ?? 0;
            const dietTotal = stats._sum.dietRating ?? 0;

            await tx.coachRating.update({
                where: { coachId },
                data: {
                    totalReviews,
                    coachRatingTotal: coachTotal,
                    planRatingTotal: planTotal,
                    dietRatingTotal: dietTotal,
                    ...this.recalcAvgs(totalReviews, coachTotal, planTotal, dietTotal),
                },
            });
            return { success: true, totalReviews, coachTotal, planTotal };
        });
    }
}