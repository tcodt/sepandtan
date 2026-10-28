import { ApiProperty } from '@nestjs/swagger';

class WishlistProductBrandEntity {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

class WishlistProductImageEntity {
  @ApiProperty({ nullable: true })
  alt?: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  url!: string;
}

class WishlistProductCategoryEntity {
  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  icon?: string | null;

  @ApiProperty()
  slug!: string;
}

class WishlistProductEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  categoryId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  isFeatured!: boolean;

  @ApiProperty()
  viewCount!: number;

  @ApiProperty()
  saleCount!: number;

  @ApiProperty()
  rating!: number;

  @ApiProperty()
  reviewCount!: number;

  @ApiProperty({ nullable: true })
  storeId?: string | null;

  @ApiProperty({ nullable: true })
  brandId?: string | null;

  @ApiProperty({ nullable: true })
  originalPrice?: string | null;

  @ApiProperty({ nullable: true })
  minPrice?: string | null;

  @ApiProperty({ nullable: true })
  discountPercent?: string | null;

  @ApiProperty({ type: WishlistProductBrandEntity, nullable: true })
  brand?: WishlistProductBrandEntity | null;

  @ApiProperty({ type: [WishlistProductImageEntity] })
  images!: WishlistProductImageEntity[];

  @ApiProperty({ type: WishlistProductCategoryEntity })
  category!: WishlistProductCategoryEntity;
}

export class WishlistEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  productId!: string;

  @ApiProperty({ type: WishlistProductEntity })
  product!: WishlistProductEntity;
}

