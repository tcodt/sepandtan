import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModules } from './common/config/config.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/user/user.module.js';
import { BankAccountModule } from './modules/bankAccount/bank_account.module.js';
import { BrandsModule } from './modules/brand/brand.module.js';
import { CartModule } from './modules/cart/cart.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { ColorsModule } from './modules/colors/colors.module.js';
import { DiscountsModule } from './modules/discounts/discounts.module.js';
import { MediaModule } from './modules/media/media.module.js';
import { OrdersModule } from './modules/orders/orders.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { ProvinceModule } from './modules/province/province.module.js';
import { ReportModule } from './modules/report/report.module.js';
import { ReviewsModule } from './modules/reviews/reviews.module.js';
import { ShippingModule } from './modules/shipping/shipping.module.js';
import { StoreModule } from './modules/store/store.module.js';
import { TicketModule } from './modules/tickets/ticket.module.js';
import { VariantsModule } from './modules/variants/variants.module.js';
import { WalletModule } from './modules/wallet/wallet.module.js';
import { WishlistModule } from './modules/wishlist/wishlist.module.js';
import { RedisModule } from './modules/redis/redis.module.js';
import { DiscountQueueModule } from './modules/queues/discount/discount-queue.module.js';
import { AddressesModule } from './modules/addresse/addresses.module.js';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    ConfigModules,
    DiscountQueueModule, 
    AuthModule, // ورود
    UserModule, // کاربران
    AddressesModule, // آدرس
    StoreModule, // فروشنده
    CategoriesModule, // دسته
    ColorsModule, // رنگ
    BrandsModule, // برند
    ProvinceModule, // شهر
    MediaModule, // رسانه
    DiscountsModule, // تخفیف
    WalletModule, // کیف پول
    BankAccountModule, // بانک
    ShippingModule, // ارسال کالا
    ProductsModule, // محصولات
    VariantsModule, // تنوع محصولات
    WishlistModule, // علاقه مندی
    CartModule, // سبد خرید
    OrdersModule, // ثبت سفارش
    TicketModule, // ثبت تیکت پشتیبانی
    ReviewsModule, // نظرات
    ReportModule, // گزارشات
  ],
})
export class AppModule { }
