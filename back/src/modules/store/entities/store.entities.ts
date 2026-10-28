import { ApiProperty } from '@nestjs/swagger';

class ProvinceEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

class CityEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  provinceId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

class StoreOwnerEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

class StoreRatingEntity {
  @ApiProperty()
  avgRating!: number;

  @ApiProperty()
  totalReviews!: number;

  @ApiProperty()
  productQuality!: number;

  @ApiProperty()
  answeredResponses!: number;

  @ApiProperty()
  totalResponseRequests!: number;

  @ApiProperty()
  responseRate!: number;

  @ApiProperty()
  responseTime!: number;

  @ApiProperty()
  saleCount!: number;

  @ApiProperty()
  returnCount!: number;
}

export class StoreEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  logo?: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  statusReason?: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  isVerified!: boolean;

  @ApiProperty()
  businessType!: string;

  @ApiProperty({ description: 'نرخ کمیسیون (به صورت رشته برای دقت اعشار)' })
  commissionRate!: string;

  @ApiProperty({ type: ProvinceEntity, nullable: true })
  province?: ProvinceEntity | null;

  @ApiProperty({ type: CityEntity, nullable: true })
  city?: CityEntity | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: StoreOwnerEntity })
  owner!: StoreOwnerEntity;

  @ApiProperty({ type: StoreRatingEntity })
  rating!: StoreRatingEntity;
}

export class StorePublicEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  logo?: string | null;

  @ApiProperty()
  isVerified!: boolean;

  @ApiProperty({ type: ProvinceEntity, nullable: true })
  province?: ProvinceEntity | null;

  @ApiProperty({ type: CityEntity, nullable: true })
  city?: CityEntity | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ type: StoreRatingEntity })
  rating!: StoreRatingEntity;
}


class StoreReviewUserEntity {
  @ApiProperty()
  name!: string;
}

class StoreReviewStoreEntity {
  @ApiProperty()
  slug!: string;
}

export class StoreReviewEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  storeId!: string;

  @ApiProperty({ type: StoreReviewUserEntity })
  user!: StoreReviewUserEntity;

  @ApiProperty({ type: StoreReviewStoreEntity })
  store!: StoreReviewStoreEntity;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  productQuality!: number;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  verifiedPurchase!: boolean;

  @ApiProperty({ nullable: true })
  productName?: string | null;

  @ApiProperty({ nullable: true })
  answerReview?: string | null;

  @ApiProperty({ nullable: true })
  answerAt?: Date | null;

  @ApiProperty({ nullable: true })
  responseAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;
}

export class StoreReviewPublicEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: StoreReviewUserEntity })
  user!: StoreReviewUserEntity;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  productQuality!: number;

  @ApiProperty()
  verifiedPurchase!: boolean;

  @ApiProperty({ nullable: true })
  productName?: string | null;

  @ApiProperty({ nullable: true })
  answerReview?: string | null;

  @ApiProperty({ nullable: true })
  responseAt?: Date | null;

  @ApiProperty()
  createdAt!: Date;
}