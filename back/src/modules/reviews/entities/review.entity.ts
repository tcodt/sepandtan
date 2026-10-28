import { ApiProperty } from '@nestjs/swagger';

class ProductReviewUserEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class ProductReviewEntity {
  @ApiProperty()
  body!: string;

  @ApiProperty({ nullable: true })
  answerReview?: string | null;

  @ApiProperty({ type: ProductReviewUserEntity })
  user!: ProductReviewUserEntity;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  updatedAt!: Date;
}

class ReviewProductEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;
}

class ReviewUserEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class ReviewEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  rating!: number;

  @ApiProperty({ nullable: true })
  title?: string | null;

  @ApiProperty()
  body!: string;

  @ApiProperty({ nullable: true })
  answerReview?: string | null;

  @ApiProperty({ nullable: true })
  answerId?: string | null;

  @ApiProperty()
  isApproved!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  verifiedPurchase!: boolean;

  @ApiProperty({ nullable: true })
  variantInfo?: any | null; // اگر ساختار JSON خاصی دارد، تایپ آن را مشخص کنید

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty({ nullable: true })
  orderId?: string | null;

  @ApiProperty({ type: ReviewProductEntity })
  product!: ReviewProductEntity;

  @ApiProperty({ type: ReviewUserEntity })
  user!: ReviewUserEntity;
}