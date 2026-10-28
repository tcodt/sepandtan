import { ApiProperty } from '@nestjs/swagger';

class ProductBrandEntity {
    @ApiProperty()
    name!: string;

    @ApiProperty()
    slug!: string;
}

class ProductImageEntity {
    @ApiProperty({ nullable: true })
    alt?: string | null;

    @ApiProperty()
    sortOrder!: number;

    @ApiProperty()
    url!: string;
}

class ProductCategoryEntity {
    @ApiProperty()
    name!: string;

    @ApiProperty({ nullable: true })
    icon?: string | null;

    @ApiProperty()
    slug!: string;
}

export class ProductListEntity {
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

    @ApiProperty({ type: ProductBrandEntity, nullable: true })
    brand?: ProductBrandEntity | null;

    @ApiProperty({ type: [ProductImageEntity] })
    images!: ProductImageEntity[];

    @ApiProperty({ type: ProductCategoryEntity })
    category!: ProductCategoryEntity;
}

class AdminProductImageEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty({ nullable: true })
    alt?: string | null;

    @ApiProperty()
    url!: string;
}

class AdminProductCategoryEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty()
    slug!: string;

    @ApiProperty({ nullable: true })
    parentId?: string | null;
}

class AdminProductStoreEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;
}

class AdminVariantDiscountEntity {
    @ApiProperty()
    type!: string;

    @ApiProperty()
    value!: string;

    @ApiProperty()
    isActive!: boolean;

    @ApiProperty({ nullable: true })
    startsAt?: Date | null;

    @ApiProperty({ nullable: true })
    endsAt?: Date | null;
}

class AdminProductVariantEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty({ nullable: true })
    sku?: string | null;

    @ApiProperty({ nullable: true })
    price?: string | null;

    @ApiProperty()
    quantity!: number;

    @ApiProperty({ nullable: true })
    discountId?: string | null;

    @ApiProperty({ type: AdminVariantDiscountEntity, nullable: true })
    discount?: AdminVariantDiscountEntity | null;
}

export class AdminProductDetailEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    title!: string;

    @ApiProperty()
    slug!: string;

    @ApiProperty({ nullable: true })
    description?: string | null;

    @ApiProperty()
    categoryId!: string;

    @ApiProperty()
    status!: string;

    @ApiProperty()
    createdAt!: Date;

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
    originalPrice?: string | null;

    @ApiProperty({ nullable: true })
    minPrice?: string | null;

    @ApiProperty({ nullable: true })
    discountPercent?: string | null;

    @ApiProperty({ type: [AdminProductImageEntity] })
    images!: AdminProductImageEntity[];

    @ApiProperty({ type: AdminProductCategoryEntity })
    category!: AdminProductCategoryEntity;

    @ApiProperty({ type: AdminProductStoreEntity, nullable: true })
    store?: AdminProductStoreEntity | null;

    @ApiProperty({ type: [AdminProductVariantEntity] })
    variants!: AdminProductVariantEntity[];
}