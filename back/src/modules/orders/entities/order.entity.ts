import { ApiProperty } from '@nestjs/swagger';

export class CheckoutEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    checkoutNumber!: string;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty({ description: 'مبلغ تخفیف اعمال شده (به صورت رشته)' })
    discountAmount!: string;

    @ApiProperty({ nullable: true })
    paymentMethod?: string | null;

    @ApiProperty()
    paymentStatus!: string;

    @ApiProperty()
    status!: string;

    @ApiProperty({ nullable: true })
    paymentRef?: string | null;

    @ApiProperty({ description: 'مبلغ کل قابل پرداخت (به صورت رشته)' })
    totalAmount!: string;

    @ApiProperty()
    userId!: string;
}

export class AdminCheckoutEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    checkoutNumber!: string;

    @ApiProperty({ description: 'مبلغ کمیسیون سایت (به صورت رشته)' })
    commissionAmount!: string;

    @ApiProperty({ description: 'سود حاصل از فروش (به صورت رشته)' })
    salesProfit!: string;

    @ApiProperty({ description: 'مبلغ کل (به صورت رشته)' })
    totalAmount!: string;

    @ApiProperty({ description: 'مبلغ تخفیف (به صورت رشته)' })
    discountAmount!: string;

    @ApiProperty({ description: 'مبلغ مالیات (به صورت رشته)' })
    taxAmount!: string;

    @ApiProperty({ nullable: true })
    discountStatus?: string | null;

    @ApiProperty()
    status!: string;

    @ApiProperty()
    paymentStatus!: string;

    @ApiProperty({ nullable: true })
    paymentMethod?: string | null;

    @ApiProperty({ nullable: true })
    paymentRef?: string | null;

    @ApiProperty()
    shippingName!: string;

    @ApiProperty()
    shippingPhone!: string;

    @ApiProperty()
    shippingCity!: string;

    @ApiProperty()
    shippingProvince!: string;

    @ApiProperty()
    shippingAddress!: string;

    @ApiProperty()
    shippingPostal!: string;

    @ApiProperty({ nullable: true })
    discountId?: string | null;

    @ApiProperty()
    userId!: string;

    @ApiProperty()
    addressId!: string;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}

export class OrderEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    orderNumber!: string;

    @ApiProperty()
    status!: string;

    @ApiProperty({ description: 'هزینه ارسال (به صورت رشته)' })
    shippingCost!: string;

    @ApiProperty({ nullable: true })
    shippingName?: string | null;

    @ApiProperty()
    storeName!: string;

    @ApiProperty({ description: 'درصد کمیسیون (به صورت رشته)' })
    commission!: string;

    @ApiProperty({ description: 'مبلغ کمیسیون (به صورت رشته)' })
    commissionAmount!: string;

    @ApiProperty({ description: 'جمع کل اقلام قبل از تخفیف و مالیات (به صورت رشته)' })
    subtotal!: string;

    @ApiProperty({ description: 'مبلغ نهایی پرداخت شده (به صورت رشته)' })
    totalPrice!: string;

    @ApiProperty({ description: 'مبلغ تخفیف (به صورت رشته)' })
    discountAmount!: string;

    @ApiProperty({ nullable: true })
    note?: string | null;

    @ApiProperty({ nullable: true })
    trackingCode?: string | null;

    @ApiProperty({ description: 'مبلغ مالیات (به صورت رشته)' })
    taxAmount!: string;

    @ApiProperty()
    checkoutId!: string;

    @ApiProperty()
    storeId!: string;

    @ApiProperty()
    userId!: string;

    @ApiProperty({ nullable: true })
    storeShippingMethodId?: string | null;

    @ApiProperty({ nullable: true })
    discountCodeId?: string | null;

    @ApiProperty({ nullable: true })
    deliveredAt?: Date | null;

    @ApiProperty({ nullable: true })
    cancelledAt?: Date | null;

    @ApiProperty({ nullable: true })
    returnDeadline?: Date | null;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}

// ===== Order Items =====

class OrderItemAttributeEntity {
    @ApiProperty()
    key!: string;

    @ApiProperty()
    label!: string;

    @ApiProperty()
    value!: string;
}

class OrderItemEntity {
    @ApiProperty()
    sku!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty({ description: 'قیمت نهایی واحد (به صورت رشته)' })
    price!: string;

    @ApiProperty({ description: 'قیمت اصلی واحد (به صورت رشته)' })
    originalPrice!: string;

    @ApiProperty({ description: 'جمع کل این آیتم (به صورت رشته)' })
    total!: string;

    @ApiProperty()
    quantity!: number;

    @ApiProperty()
    returnedQty!: number;

    @ApiProperty({ type: [OrderItemAttributeEntity] })
    attributes!: OrderItemAttributeEntity[];

    @ApiProperty({ nullable: true })
    colorName?: string | null;

    @ApiProperty({ nullable: true })
    colorHex?: string | null;

    @ApiProperty()
    productId!: string;
}

// ===== Order =====

class CheckoutOrderEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    orderNumber!: string;

    @ApiProperty()
    status!: string;

    @ApiProperty({ description: 'هزینه ارسال (به صورت رشته)' })
    shippingCost!: string;

    @ApiProperty({ nullable: true })
    shippingName?: string | null;

    @ApiProperty()
    storeName!: string;

    @ApiProperty({ description: 'درصد کمیسیون (به صورت رشته)' })
    commission!: string;

    @ApiProperty({ description: 'مبلغ کمیسیون (به صورت رشته)' })
    commissionAmount!: string;

    @ApiProperty({ description: 'جمع کل اقلام قبل از تخفیف و مالیات (به صورت رشته)' })
    subtotal!: string;

    @ApiProperty({ description: 'مبلغ نهایی پرداخت شده (به صورت رشته)' })
    totalPrice!: string;

    @ApiProperty({ description: 'مبلغ تخفیف (به صورت رشته)' })
    discountAmount!: string;

    @ApiProperty({ nullable: true })
    note?: string | null;

    @ApiProperty({ nullable: true })
    trackingCode?: string | null;

    @ApiProperty({ description: 'مبلغ مالیات (به صورت رشته)' })
    taxAmount!: string;

    @ApiProperty()
    checkoutId!: string;

    @ApiProperty()
    storeId!: string;

    @ApiProperty()
    userId!: string;

    @ApiProperty({ nullable: true })
    storeShippingMethodId?: string | null;

    @ApiProperty({ nullable: true })
    discountCodeId?: string | null;

    @ApiProperty({ nullable: true })
    deliveredAt?: Date | null;

    @ApiProperty({ nullable: true })
    cancelledAt?: Date | null;

    @ApiProperty({ nullable: true })
    returnDeadline?: Date | null;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;

    @ApiProperty({ type: [OrderItemEntity] })
    items!: OrderItemEntity[];
}

// ===== Checkout =====

export class CheckoutDetailEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    checkoutNumber!: string;

    @ApiProperty({ description: 'مبلغ کمیسیون سایت (به صورت رشته)' })
    commissionAmount!: string;

    @ApiProperty({ description: 'سود حاصل از فروش (به صورت رشته)' })
    salesProfit!: string;

    @ApiProperty({ description: 'مبلغ کل (به صورت رشته)' })
    totalAmount!: string;

    @ApiProperty({ description: 'مبلغ تخفیف (به صورت رشته)' })
    discountAmount!: string;

    @ApiProperty({ description: 'مبلغ مالیات (به صورت رشته)' })
    taxAmount!: string;

    @ApiProperty({ nullable: true })
    discountStatus?: string | null;

    @ApiProperty()
    status!: string;

    @ApiProperty()
    paymentStatus!: string;

    @ApiProperty({ nullable: true })
    paymentMethod?: string | null;

    @ApiProperty({ nullable: true })
    paymentRef?: string | null;

    @ApiProperty()
    shippingName!: string;

    @ApiProperty()
    shippingPhone!: string;

    @ApiProperty()
    shippingCity!: string;

    @ApiProperty()
    shippingProvince!: string;

    @ApiProperty()
    shippingAddress!: string;

    @ApiProperty()
    shippingPostal!: string;

    @ApiProperty({ nullable: true })
    discountId?: string | null;

    @ApiProperty()
    userId!: string;

    @ApiProperty()
    addressId!: string;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;

    @ApiProperty({ type: [CheckoutOrderEntity] })
    orders!: CheckoutOrderEntity[];
}