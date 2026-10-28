import { ApiProperty } from '@nestjs/swagger';

class DiscountUserStoreEntity {
    @ApiProperty()
    slug!: string;

    @ApiProperty()
    name!: string;
}

class DiscountUserEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty({ type: DiscountUserStoreEntity, nullable: true })
    store?: DiscountUserStoreEntity | null;
}

export class DiscountEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    code!: string;

    @ApiProperty({ nullable: true })
    description?: string | null;

    @ApiProperty({ description: 'سقف مبلغ تخفیف (به صورت رشته به دلیل دقت اعشار)' })
    maxDiscount!: string;

    @ApiProperty({ description: 'مقدار تخفیف (درصدی یا مبلغ ثابت)' })
    value!: string;

    @ApiProperty({ description: 'حداقل مبلغ سفارش برای اعمال تخفیف' })
    minOrderAmount!: string;

    @ApiProperty()
    usageLimit!: number;

    @ApiProperty()
    usedCount!: number;

    @ApiProperty()
    perUserLimit!: number;

    @ApiProperty()
    isActive!: boolean;

    @ApiProperty()
    status!: string;

    @ApiProperty()
    type!: string;

    @ApiProperty()
    userId!: string;

    @ApiProperty()
    startsAt!: Date;

    @ApiProperty()
    endsAt!: Date;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;

    @ApiProperty({ type: DiscountUserEntity })
    user!: DiscountUserEntity;
}

export class DiscountSelectorEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    code!: string;

    @ApiProperty()
    isActive: boolean
}