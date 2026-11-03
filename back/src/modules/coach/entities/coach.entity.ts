import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CertificationEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  coachId!: string;

  @ApiProperty({
    enum: ['ACADEMIC', 'PROFESSIONAL', 'FEDERATION', 'WORKSHOP', 'OTHER'],
    example: 'ACADEMIC',
  })
  type!: string;

  @ApiProperty({ example: 'کارشناسی تربیت بدنی' })
  title!: string;

  @ApiPropertyOptional({ example: 'تربیت بدنی و علوم ورزشی', nullable: true })
  field?: string | null;

  @ApiPropertyOptional({ example: 'کارشناسی', nullable: true })
  level?: string | null;

  @ApiPropertyOptional({ example: 'دانشگاه تهران', nullable: true })
  issuer?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/cert/1.jpg', nullable: true })
  documentUrl?: string | null;

  @ApiProperty({ example: false, description: 'مدرک اصلی/شاخص' })
  isPrimary!: boolean;

  @ApiProperty({ example: false, description: 'تأییدشده توسط ادمین' })
  isVerified!: boolean;

  @ApiPropertyOptional({
    example: '2025-09-01T00:00:00.000Z',
    nullable: true,
    description: 'تاریخ انقضا (null = بدون انقضا)',
  })
  expiresAt?: Date | null;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}

export class AvailabilityEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  coachId!: string;

  @ApiProperty({ example: 0, description: '۰ = شنبه ... ۶ = جمعه' })
  weekday!: number;

  @ApiProperty({ example: '09:00' })
  startTime!: string;

  @ApiProperty({ example: '13:00' })
  endTime!: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: Date;
}

export class AchievementEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  coachId!: string;

  @ApiProperty({ example: 'مدال طلای پرس سینه' })
  title!: string;

  @ApiProperty({ enum: ['MEDAL', 'TROPHY', 'TITLE', 'AWARD', 'RECORD', 'OTHER'], example: 'MEDAL' })
  type!: string;

  @ApiProperty({ enum: ['LOCAL', 'NATIONAL', 'INTERNATIONAL', 'ACADEMIC', 'OTHER'], example: 'NATIONAL' })
  scope!: string;

  @ApiPropertyOptional({ example: 'فدراسیون بدنسازی', nullable: true })
  issuer?: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  place?: number | null;

  @ApiPropertyOptional({ example: 'مسابقات کشوری ۱۴۰۳', nullable: true })
  eventName?: string | null;

  @ApiPropertyOptional({ example: 'مدال طلا در وزن ۸۰ کیلوگرم', nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/achievement/medal.jpg', nullable: true })
  documentUrl?: string | null;

  @ApiProperty({ example: false })
  isVerified!: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  year!: Date;

  @ApiProperty({ example: 1 })
  sortOrder!: number;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  updatedAt!: Date;
}

class CoachRatingEntity {
  @ApiProperty({ example: '...' }) id!: string;
  @ApiProperty({ example: 4.5 }) avgCoachRating!: number;
  @ApiProperty({ example: 3 }) totalReviews!: number;
  @ApiProperty({ example: 10 }) completedClients!: number;
  @ApiProperty({ example: 5 }) activeClients!: number;
  @ApiProperty({ example: 4.2 }) avgPlanRating!: number;
  @ApiProperty({ example: 4.1 }) avgDietRating!: number;
}

class CityEntity {
  @ApiProperty({ example: '...' }) id!: string;
  @ApiProperty({ example: 'تهران' }) name!: string;
}

class ProvinceEntity {
  @ApiProperty({ example: '...' }) id!: string;
  @ApiProperty({ example: 'تهران' }) name!: string;
}

export class CoachEntity {
  @ApiProperty({ example: '...' }) id!: string;
  @ApiProperty({ example: 'علی رضایی' }) title!: string;
  @ApiProperty({ example: 'ali-rezaei' }) slug!: string;
  @ApiPropertyOptional({ example: 'مربی بدنسازی و تغذیه', nullable: true }) headline?: string;
  @ApiPropertyOptional({ example: 'دارای ۵ سال سابقه...', nullable: true }) bio?: string;
  @ApiProperty({ example: true }) isAcceptingClients!: boolean;

  @ApiPropertyOptional({ type: CoachRatingEntity, nullable: true })
  coachRating?: CoachRatingEntity;

  @ApiPropertyOptional({ type: CityEntity, nullable: true })
  city?: CityEntity;

  @ApiPropertyOptional({ type: ProvinceEntity, nullable: true })
  province?: ProvinceEntity;
}

export class CoachSelectorEntity {
  @ApiProperty({ example: '...' }) id!: string;
  @ApiProperty({ example: 'علی رضایی' }) title!: string;
  @ApiProperty({ example: 'ali-rezaei' }) slug!: string;
}

class ReviewAuthorEntity {
  @ApiProperty({ example: 'علی رضایی' })
  name!: string;

  @ApiPropertyOptional({ example: 'https://...', nullable: true })
  avatar?: string | null;
}

export class ReviewCoachEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiPropertyOptional({ example: 'نظر خیلی خوبی بود', nullable: true })
  body?: string | null;

  @ApiProperty({ type: [String], example: [] })
  images!: string[];

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiPropertyOptional({ example: 'ممنون از نظر شما', nullable: true })
  answerReview?: string | null;

  @ApiPropertyOptional({ example: '2025-01-02T00:00:00.000Z', nullable: true })
  answeredAt?: Date | null;

  @ApiProperty({ example: 5 })
  coachRating!: number;

  @ApiProperty({ example: 4 })
  planRating!: number;

  @ApiProperty({ example: 4 })
  dietRating!: number;

  @ApiProperty({ example: false })
  isAnonymous!: boolean;

  @ApiProperty({ example: true })
  isVerified!: boolean;

  @ApiProperty({ example: 3 })
  likeCount!: number;

  @ApiProperty({ example: 0 })
  dislikeCount!: number;

  @ApiPropertyOptional({ type: ReviewAuthorEntity, nullable: true, description: 'null اگر نظر ناشناس باشد' })
  author?: ReviewAuthorEntity | null;
}

class ReviewAdminCoachEntity {
  @ApiProperty({ example: '...' })
  id!: string;

  @ApiProperty({ example: 'علی رضایی' })
  title!: string;

  @ApiProperty({ example: 'ali-rezaei' })
  slug!: string;
}

class ReviewAdminAuthorEntity {
  @ApiProperty({ example: '...' })
  id!: string;

  @ApiProperty({ example: 'کاربر' })
  name!: string;
}

export class ReviewCoachAdminEntity {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  id!: string;

  @ApiPropertyOptional({ example: 'نظر', nullable: true })
  body?: string | null;

  @ApiProperty({ type: [String], example: [] })
  images!: string[];

  @ApiProperty({ enum: ['PENDING', 'APPROVED', 'REJECTED'], example: 'APPROVED' })
  status!: string;

  @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: 5 })
  coachRating!: number;

  @ApiProperty({ example: 4 })
  planRating!: number;

  @ApiProperty({ example: 4 })
  dietRating!: number;

  @ApiProperty({ example: false })
  isAnonymous!: boolean;

  @ApiProperty({ example: true })
  isVerified!: boolean;

  @ApiProperty({ example: 3 })
  likeCount!: number;

  @ApiProperty({ example: 0 })
  dislikeCount!: number;

  @ApiProperty({ type: ReviewAdminCoachEntity })
  coach!: ReviewAdminCoachEntity;

  @ApiProperty({ type: ReviewAdminAuthorEntity })
  author!: ReviewAdminAuthorEntity;
}