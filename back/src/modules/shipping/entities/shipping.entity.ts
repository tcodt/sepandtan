import { ApiProperty } from '@nestjs/swagger';

export class ShippingMethodEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty()
    isFreeMethod!: boolean;

    @ApiProperty()
    isActive!: boolean;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}

export class StoreShippingMethodEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ nullable: true })
  description?: string | null;

  @ApiProperty({ nullable: true })
  phrase?: string | null;

  @ApiProperty()
  minDays!: number;

  @ApiProperty()
  maxDays!: number;

  @ApiProperty({ description: 'قیمت پیش‌فرض (به صورت رشته به دلیل دقت اعشار)' })
  defaultPrice!: string;

  @ApiProperty()
  storeId!: string;

  @ApiProperty()
  shippingMethodId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

class ProvinceEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;
}

export class ShippingRateEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty({ description: 'هزینه ارسال (به صورت رشته به دلیل دقت اعشار)' })
  price!: string;

  @ApiProperty()
  deliveryMaxDays!: number;

  @ApiProperty({ type: ProvinceEntity })
  province!: ProvinceEntity;
}