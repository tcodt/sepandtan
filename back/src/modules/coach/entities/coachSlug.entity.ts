import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CoachRatingEntity {
    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    id!: string;

    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    coachId!: string;

    @ApiProperty({ example: 4.5, description: 'میانگین امتیاز مربی (۰-۵)' })
    avgCoachRating!: number;

    @ApiProperty({ example: 45.0, description: 'مجموع امتیازهای مربی' })
    coachRatingTotal!: number;

    @ApiProperty({ example: 10 })
    totalReviews!: number;

    @ApiProperty({ example: 4.2, description: 'میانگین امتیاز برنامه (۰-۵)' })
    avgPlanRating!: number;

    @ApiProperty({ example: 42.0 })
    planRatingTotal!: number;

    @ApiProperty({ example: 4.1, description: 'میانگین امتیاز برنامه غذایی (۰-۵)' })
    avgDietRating!: number;

    @ApiProperty({ example: 41.0 })
    dietRatingTotal!: number;

    @ApiProperty({ example: 15, description: 'تعداد مشتریان تکمیل‌شده' })
    completedClients!: number;

    @ApiProperty({ example: 5, description: 'تعداد مشتریان فعال' })
    activeClients!: number;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    updatedAt!: Date;
}
export class CityEntity {
    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    id!: string;

    @ApiProperty({ example: 'تهران' })
    name!: string;

    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    provinceId!: string;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    createdAt!: Date;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    updatedAt!: Date;
}

export class ProvinceEntity {
    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    id!: string;

    @ApiProperty({ example: 'تهران' })
    name!: string;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    createdAt!: Date;

    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' })
    updatedAt!: Date;
}

export class ProvinceWithCitiesEntity extends ProvinceEntity {
    @ApiProperty({ type: [CityEntity] })
    cities!: CityEntity[];
}

export class CityWithProvinceEntity extends CityEntity {
    @ApiProperty({ type: ProvinceEntity })
    province!: ProvinceEntity;
}
class ReviewEntity {
    @ApiProperty({ example: '...' }) id!: string;
    @ApiPropertyOptional({ example: 'نظر خیلی خوب', nullable: true }) body?: string;
    @ApiProperty({ example: false }) isAnonymous!: boolean;
    @ApiProperty({ type: [String], example: [] }) images!: string[];
    @ApiProperty({ example: '2025-01-01T00:00:00.000Z' }) createdAt!: Date;
    @ApiPropertyOptional({ example: 'ممنون', nullable: true }) answerReview?: string;
    @ApiProperty({ example: 5 }) coachRating!: number;
    @ApiProperty({ example: 4 }) planRating!: number;
    @ApiProperty({ example: 4 }) dietRating!: number;
    @ApiProperty({ example: true }) isVerified!: boolean;
    @ApiProperty({ example: 3 }) likeCount!: number;
    @ApiProperty({ example: 0 }) dislikeCount!: number;
    @ApiProperty({ example: { name: 'کاربر', avatar: null } })
    author!: { name: string; avatar?: string | null };
}

class SpecialtyEntity {
    @ApiProperty({ example: '...' }) id!: string;
    @ApiProperty({ example: 'bodybuilding' }) slug!: string;
    @ApiProperty({ example: 'بدنسازی' }) title!: string;
}

class AvailabilityEntity {
    @ApiProperty({ example: '...' }) id!: string;
    @ApiProperty({ example: 0 }) weekday!: number;
    @ApiProperty({ example: '09:00' }) startTime!: string;
    @ApiProperty({ example: '13:00' }) endTime!: string;
}

class AchievementEntity {
    @ApiProperty({ example: '...' }) id!: string;
    @ApiProperty({ example: 'مدال طلا' }) title!: string;
    @ApiProperty({ example: 'MEDAL' }) type!: string;
    @ApiProperty({ example: 'NATIONAL' }) scope!: string;
    @ApiPropertyOptional({ example: 'فدراسیون', nullable: true }) issuer?: string;
    @ApiPropertyOptional({ example: 1, nullable: true }) place?: number;
    @ApiProperty({ example: '2024-01-01T00:00:00.000Z' }) year!: Date;
    @ApiPropertyOptional({ example: 'مسابقات کشوری', nullable: true }) eventName?: string;
    @ApiPropertyOptional({ example: '...', nullable: true }) description?: string;
    @ApiPropertyOptional({ example: 'https://...', nullable: true }) documentUrl?: string;
    @ApiProperty({ example: 1 }) sortOrder!: number;
}

class CertificationEntity {
    @ApiProperty({ example: 'ACADEMIC' }) type!: string;
    @ApiProperty({ example: 'کارشناسی تربیت بدنی' }) title!: string;
    @ApiPropertyOptional({ example: 'کارشناسی', nullable: true }) level?: string;
    @ApiPropertyOptional({ example: 'تربیت بدنی', nullable: true }) field?: string;
    @ApiPropertyOptional({ example: 'دانشگاه تهران', nullable: true }) issuer?: string;
    @ApiPropertyOptional({ example: 'https://...', nullable: true }) documentUrl?: string;
}

class WorkoutPlanEntity {
    @ApiProperty({ example: '...' }) id!: string;
    @ApiProperty({ example: 'برنامه حجم' }) title!: string;
    @ApiProperty({ type: [String], example: [] }) coverImage!: string[];
    @ApiPropertyOptional({ example: '...', nullable: true }) description?: string;
    @ApiProperty({ example: 100000 }) price!: number;
    @ApiPropertyOptional({ example: 80000, nullable: true }) discountPrice?: number;
    @ApiPropertyOptional({ example: 18, nullable: true }) minAge?: number;
    @ApiPropertyOptional({ example: 60, nullable: true }) maxAge?: number;
    @ApiPropertyOptional({ example: '...', nullable: true }) note?: string;
    @ApiProperty({ example: 4.5 }) avgRating!: number;
    @ApiPropertyOptional({ example: 8, nullable: true }) durationWeeks?: number;
    @ApiPropertyOptional({ example: 'MALE', nullable: true }) gender?: string;
    @ApiPropertyOptional({ example: 'GYM', nullable: true }) trainingLocation?: string;
    @ApiPropertyOptional({ example: 'ACTIVE', nullable: true }) activityLevel?: string;
    @ApiPropertyOptional({ example: 'BEGINNER', nullable: true }) experienceLevel?: string;
    @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z', nullable: true }) discountExpired?: Date;
}

class DietPlanEntity {
    @ApiProperty({ example: '...' }) id!: string;
    @ApiProperty({ example: 'برنامه غذایی' }) title!: string;
    @ApiPropertyOptional({ example: '...', nullable: true }) description?: string;
    @ApiProperty({ example: 100000 }) price!: number;
    @ApiPropertyOptional({ example: 80000, nullable: true }) discountPrice?: number;
    @ApiProperty({ example: 3 }) countRating!: number;
    @ApiProperty({ example: 15 }) totalRating!: number;
    @ApiProperty({ type: [String], example: [] }) coverImage!: string[];
    @ApiProperty({ example: 4.5 }) avgRating!: number;
    @ApiProperty({ example: 'COACH' }) source!: string;
    @ApiPropertyOptional({ example: 2500, nullable: true }) targetCalories?: number;
    @ApiPropertyOptional({ example: 150, nullable: true }) targetProteinG?: number;
    @ApiPropertyOptional({ example: 250, nullable: true }) targetCarbsG?: number;
    @ApiPropertyOptional({ example: 70, nullable: true }) targetFatG?: number;
    @ApiPropertyOptional({ example: 8, nullable: true }) durationWeeks?: number;
    @ApiPropertyOptional({ example: '2025-01-01T00:00:00.000Z', nullable: true }) discountExpired?: Date;
}

export class CoachDetailsEntity {
    @ApiProperty({ example: '...' }) id!: string;
    @ApiProperty({ example: 'علی رضایی' }) title!: string;
    @ApiProperty({ example: 'ali-rezaei' }) slug!: string;
    @ApiPropertyOptional({ example: 'مربی بدنسازی', nullable: true }) headline?: string;
    @ApiPropertyOptional({ example: '...', nullable: true }) bio?: string;
    @ApiPropertyOptional({ example: 'coach_ali', nullable: true }) instagram?: string;
    @ApiProperty({ example: true }) isAcceptingClients!: boolean;
    @ApiProperty({ example: 20 }) maxClients!: number;

    @ApiPropertyOptional({ type: CityEntity, nullable: true }) city?: CityEntity;
    @ApiPropertyOptional({ type: ProvinceEntity, nullable: true }) province?: ProvinceEntity;
    @ApiPropertyOptional({ nullable: true, example: { id: '...', address: '...', phone: '...' } })
    address?: { id: string; address: string; phone: string } | null;

    @ApiPropertyOptional({ type: CoachRatingEntity, nullable: true }) coachRating?: CoachRatingEntity;
    @ApiPropertyOptional({ type: [ReviewEntity] }) reviews?: ReviewEntity[];
    @ApiPropertyOptional({ type: [SpecialtyEntity] }) specialties?: SpecialtyEntity[];
    @ApiPropertyOptional({ type: [AvailabilityEntity] }) availabilities?: AvailabilityEntity[];
    @ApiPropertyOptional({ type: [AchievementEntity] }) coachAchievements?: AchievementEntity[];
    @ApiPropertyOptional({ type: [CertificationEntity] }) certifications?: CertificationEntity[];
    @ApiPropertyOptional({ type: [WorkoutPlanEntity] }) workoutPlans?: WorkoutPlanEntity[];
    @ApiPropertyOptional({ type: [DietPlanEntity] }) dietPlans?: DietPlanEntity[];
}