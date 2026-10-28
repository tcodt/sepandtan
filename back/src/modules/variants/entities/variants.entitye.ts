import { ApiProperty } from '@nestjs/swagger';

class AttributeCategoryEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class AttributeEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ type: [AttributeCategoryEntity] })
  category!: AttributeCategoryEntity[];
}

class VariantDiscountEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  type!: string;

  @ApiProperty({ nullable: true })
  startsAt?: Date | null;

  @ApiProperty({ nullable: true })
  endsAt?: Date | null;
}

class VariantColorEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  hexCode!: string;

  @ApiProperty()
  name!: string;
}

class VariantAttributeDefinitionEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  key!: string;

  @ApiProperty()
  label!: string;
}

class VariantAttributeEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  value!: string;

  @ApiProperty()
  attributeId!: string;

  @ApiProperty({ type: VariantAttributeDefinitionEntity })
  attribute!: VariantAttributeDefinitionEntity;
}

export class ProductVariantEntity {
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
  colorId?: string | null;

  @ApiProperty({ nullable: true })
  image?: string | null;

  @ApiProperty()
  saleCount!: number;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ nullable: true })
  discountId?: string | null;

  @ApiProperty()
  productId!: string;

  @ApiProperty({ type: VariantDiscountEntity, nullable: true })
  discount?: VariantDiscountEntity | null;

  @ApiProperty({ type: VariantColorEntity, nullable: true })
  color?: VariantColorEntity | null;

  @ApiProperty({ type: [VariantAttributeEntity] })
  attributes!: VariantAttributeEntity[];
}