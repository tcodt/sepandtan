import { ApiProperty } from '@nestjs/swagger';

class CartStoreEntity {
  @ApiProperty()
  commissionRate!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}

class CartProductImageEntity {
  @ApiProperty({ nullable: true })
  alt?: string | null;

  @ApiProperty()
  url!: string;
}

class CartProductEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  storeId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ type: CartStoreEntity })
  store!: CartStoreEntity;

  @ApiProperty({ type: [CartProductImageEntity] })
  images!: CartProductImageEntity[];
}

class CartAttributeDefinitionEntity {
  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  id!: string;
}

class CartVariantAttributeEntity {
  @ApiProperty()
  value!: string;

  @ApiProperty()
  id!: string;

  @ApiProperty({ type: CartAttributeDefinitionEntity })
  attribute!: CartAttributeDefinitionEntity;
}

class CartVariantColorEntity {
  @ApiProperty()
  name!: string;
}

class CartVariantDiscountEntity {
  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  id!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty({ nullable: true })
  endsAt?: Date | null;
}

class CartVariantEntity {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  id!: string;

  @ApiProperty({ type: CartVariantColorEntity, nullable: true })
  color?: CartVariantColorEntity | null;

  @ApiProperty()
  price!: string;

  @ApiProperty({ nullable: true })
  sku?: string | null;

  @ApiProperty({ type: [CartVariantAttributeEntity] })
  attributes!: CartVariantAttributeEntity[];

  @ApiProperty({ type: CartVariantDiscountEntity, nullable: true })
  discount?: CartVariantDiscountEntity | null;
}

class CartItemEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  quantity!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  variantId!: string;

  @ApiProperty({ type: CartProductEntity })
  product!: CartProductEntity;

  @ApiProperty({ type: CartVariantEntity })
  variant!: CartVariantEntity;

  @ApiProperty({ description: 'قیمت کل این آیتم (پس از تخفیف)' })
  totalPrice!: number;

  @ApiProperty({ description: 'مجموع تخفیف این آیتم' })
  totalDiscount!: number;
}

class StoreCartGroupEntity {
  @ApiProperty()
  storeId!: string;

  @ApiProperty()
  storeName!: string;

  @ApiProperty()
  storeSlug!: string;

  @ApiProperty()
  commissionRate!: string;

  @ApiProperty({ type: [CartItemEntity] })
  carts!: CartItemEntity[];
}

export class CartResponseEntity {
  @ApiProperty()
  totalItems!: number;

  @ApiProperty()
  totalPrice!: number;

  @ApiProperty({ type: [StoreCartGroupEntity] })
  stores!: StoreCartGroupEntity[];
}