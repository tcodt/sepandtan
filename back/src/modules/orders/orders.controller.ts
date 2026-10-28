/**
 * OrdersController - کنترلر سفارشات
 */
import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, BadRequestException, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CreateCheckoutDto, SearchCheckouts, SearchOrders, UpdateCheckoutDto, updateStoreOrderDto } from './dto/order.dto.js';

import { OrdersService } from './orders.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { RolePerson } from '../../generated/prisma/enums.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { AdminCheckoutEntity, CheckoutDetailEntity, CheckoutEntity, OrderEntity } from './entities/order.entity.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(AccessTokenGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post()
    @ApiOperation({
        summary: 'ثبت تسویه حساب (User)', description: `
        * کد تخفیف اجباری نیست ارسالش
        * آیدی آدرس پیشفرض رو ارسال کن
        * آیدی روش ارسال و آیدی فروشنده باید درست و مرتب و هماهنگ شده ارسال کنی یعنی هر ابجکت مختص یه فروشنده و یه آیدی روش ارسال باشه
        * روش پرداخت ممکنه بعدا بازم تغییر بکنه
        `})
    async create(@CurrentUser('id') userId: string, @Body() dto: CreateCheckoutDto) {
        return this.ordersService.createCheckout(userId, dto);
    }

    @Get('/me')
    @ApiOperation({ summary: 'لیست تسوبه حساب خودم (User)', description: 'کاربر یه نگاه کلی از وضعیت تسویه حساب هایی که انجام داده میبینه' })
    @ApiOkResponse({ type: PaginatedResponse(CheckoutEntity, 'checkouts') })
    async getMyChekout(@CurrentUser('id') userId: string, @Query() query: SearchCheckouts) {
        return this.ordersService.getMyChekout(userId, query);
    }

    @Get('/admin')
    @ApiOkResponse({ type: PaginatedResponse(AdminCheckoutEntity, 'checkouts') })
    @Roles('SUPERADMIN', 'ADMIN')
    @ApiOperation({ summary: 'لیست تسویه حساب های ادمین (Admin)', description: 'تمام تسویه حساب های پرداخت شده یا نشده' })
    async getAdminChekout(@Query() query: SearchCheckouts) {
        return this.ordersService.getAdminChekout(query);
    }

    @Get('/admin/order')
    @ApiOkResponse({ type: PaginatedResponse(OrderEntity, 'orders') })
    @Roles('SUPERADMIN', 'ADMIN')
    @ApiOperation({ summary: 'لیست سفارش های داخل تسویه حساب (Admin)', description: 'تمام سفارش هایی که برای فروشنده ها ثبت شده رو ادمین هم میتونه ببینه' })
    async getAllAdminOrder(@Query() query: SearchOrders) {
        return this.ordersService.getAdminOrder(query);
    }

    @Get('/store/:storeId')
    @ApiOkResponse({ type: PaginatedResponse(OrderEntity, 'orders') })
    @Roles('SUPERADMIN', 'ADMIN', 'STORE')
    @ApiOperation({ summary: 'لیست سفارشات متناسب به هر فروشنده (Admin & Store)', description: 'باید حواست باشه که آیدی هر فروشنده رو پیشفرض بفرستی تا فقط سفارش های مربوط به خودش رو بهش نمایش بدم' })
    async getStoresOrder(@Param('id') storeId: string, @Query() query: SearchOrders) {
        return this.ordersService.getStoresOrder(storeId, query);
    }

    @Get('/id/:id')
    @ApiOkResponse({ type: CheckoutDetailEntity })
    @ApiOperation({
        summary: 'نمایش تسویه حساب سفارش کاربر و ادمین (User)', description: `
        * کاربر یه اطلاعات کمتری نسبت به ادمین میتونه ببینه یا این که باید بهش نمایش بدی
        * ادمین میتونه اطلاعات مالیاتی صود و ضرر یا کمیسیون هارو ببینه در رابطه با هر فروشنده 
        * کاربر مجازه که بیاد بزنه و جزئیات هر تسویه حسابش رو ببینه
        * این یعنی نباید به فروشنده نمایشش بدی و مجاز به دیدن این بخش یا تسویه حساب ها نیست فقط میتونه سفارش هارو ببینه
        `})
    async getOrderDetail(@Param('id') id: string) {
        return this.ordersService.getDetailCheckout(id);
    }

    @Put('/edit/:id')
    @Roles('SUPERADMIN', 'ADMIN', 'STORE')
    @ApiOperation({ summary: '(Admin & Store) آپدیت وضعیت سفارش', description: 'اینجا فروشنده باید موقعی که سفارش رو داد دست مامور پست اون وقت موقعیت سفارش رو تغییر بده به در حال ارسال و ادمین هم هر نوع دسترسی رو میتونه داشته باشه از لغو تا دریافت' })
    async updateOrderStore(@Param('id') orderId: string, @Body() body: updateStoreOrderDto) {
        return this.ordersService.updateOrderStore(orderId, body);
    }

    @Put('/:id')
    @Roles('SUPERADMIN', 'ADMIN')
    @ApiOperation({ summary: 'ویرایش تسویه حساب توسط ادمین (Admin)', description: 'این برای زمانی هستش که کاربر ادرسش رو اشتباه ثبت کرده باشه یا چیزای دیگه اون وقت ادمین میتونه به صورت دستی اطلاعات رو تغییر بده' })
    async updateCheckout(@Param('id') idCheckout: string, @Body() body: UpdateCheckoutDto, @CurrentUser('role') role: RolePerson,) {
        return this.ordersService.updateCheckout(idCheckout, body, role);
    }

    @Patch('/:id')
    @ApiOperation({ summary: 'پرداخت سفارش (User)', description: 'فعلا درست نشده' })
    async updatePayment(@Param('id') chekoutId: string) {
        return this.ordersService.updatePaymentCheckout(chekoutId);
    }

    @Delete('/:id')
    @ApiOperation({ summary: 'حذف سفارش توسط کاربر و ادمین', description: 'سفارش کاملا حذف نمیشه فقط وضعیتش  تغییر میکنه' })
    async deleteCheckout(@Param('id') id: string) {
        return this.ordersService.deleteCheckout(id);
    }
}