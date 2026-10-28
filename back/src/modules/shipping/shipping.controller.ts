import { Controller, Get, Post, Body, Delete, Param, HttpCode, HttpStatus, Put, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CreateShippingMethodDto, CreateStoreShippingDto, CreateStoreShippingRateDto, UpdateStoreShippingDto } from './dto/shipping.dto.js';
import { ShippingService } from './shipping.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { RolePerson } from '../../generated/prisma/enums.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ShippingMethodEntity, ShippingRateEntity, StoreShippingMethodEntity } from './entities/shipping.entity.js';



@ApiTags('Shipping')
@Controller('shipping')
@UseGuards(AccessTokenGuard)
export class ShippingController {
    constructor(private readonly shippingService: ShippingService) { }
    /// Shipping Method ///
    @Get('order/:provinceId')
    @ApiOperation({ summary: 'دریافت روش های ارسال کاربر', description: 'کاربر زمانی که ثبت سفارش میکنه شهر و استان رو انتخاب میکنه آیدی استان رو باید ارسال بکنی و اون موقع روش های ارسال هر فروشنده رو متناسب با استان کاربر برات ارسال میشه' })
    @ApiResponse({ status: 200, description: 'Success' })
    shippingForOrder(@Param('provinceId') provinceId: string, @CurrentUser('id') userId: string) {
        return this.shippingService.getShippingWithProvince(provinceId, userId);
    }

    @Get('/')
    @Roles('SUPERADMIN', 'ADMIN', 'STORE')
    @ApiOperation({ summary: 'دریافت تمام روش های ارسال (shippingMethod)' })
    @ApiResponse({ status: 200, description: 'Success' })
    @ApiOkResponse({ type: [ShippingMethodEntity] })
    findAllShipping(@CurrentUser('role') userId: RolePerson) {
        return this.shippingService.findAllShipping(userId);
    }

    @Post('/')
    @Roles('SUPERADMIN', 'ADMIN')
    @ApiOperation({ summary: 'ساخت روش ارسال (Admin) (shippingMethod)', description: 'ادمین چند روش ارسال رو معرفی میکنه و بعدش فروشنده میتونن اون هارو انتخاب بکنن و اطلاعات خودشون رو متناسب با اون روش ها پر کنن' })
    createShipping(@Body() dto: CreateShippingMethodDto) {
        return this.shippingService.createShipping(dto);
    }

    @Put('/:id')
    @Roles('ADMIN', 'STORE')
    @ApiOperation({ summary: 'ویرایش روش ارسال (Admin) (shippingMethod)' })
    updateShipping(@Param('id') id: string, @Body() dto: CreateShippingMethodDto) {
        return this.shippingService.updateShipping(id, dto);
    }

    @Delete('/:id')
    @ApiOperation({ summary: 'حذف روش ارسال (Admin) (shippingMethod)' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    removeShipping(@Param('id') id: string) {
        return this.shippingService.removeShipping(id);
    }

    /// شیوه ارسال شخصی سازی شده توسط فروشنده StoreShippingMethod ///
    @Get('store')
    @Roles('SUPERADMIN', 'ADMIN', 'STORE')
    @ApiOperation({ summary: 'لیست تمام شیوه های ارسال فروشنده که تا به حال ثبت کرده (Admin & Store) (storeShippingMethod)' })
    @ApiOkResponse({ type: [StoreShippingMethodEntity] })
    getAllMeStoreShipping(@CurrentUser('id') userId: RolePerson) {
        return this.shippingService.getAllMeStoreShipping(userId);
    }

    @Post('store')
    @Roles('SUPERADMIN', 'ADMIN', 'STORE')
    @ApiOperation({
        summary: 'ساخت روش ارسال سفارشی فروشنده (Admin & Store) (storeShippingMethodId)',
        description: `
        * حالت قیمت پیش فرض برای زمانی درست شده که کاربر اگر خواست مثلا 20 تا استان رو یه قیمت در نظر بگیره اون وقت میتونه این قیمت پیش فرض رو بزاره و اون 10 تا استان دیگه رو شخصی سازی بکنه و قیمت جدا بزاره براشون
        * توضیحات و شعار ها برای هر فروشنده میتونه متفاوت باشه
        * خودت سعی کن محدودیت بزاری که حداکثر روز ارسالی از حداقل کمتر نباشه
        * فروشنده باید تناسب با روش های ارسالی که ادمین معرفی کرده دونه به دونه اونایی که میخواد رو اینطوری انتخاب بکنه و حدودا مشخص بکنه نسبت به موقعیت مکانی خودش این شیوه ها چقدر هزینه دارن یا چقدر وثت میبره بسته به دست مشتری برسه همینطور شعار و توضیحات مخصوص خودشون رو میتونن داشته باشن
        ` })
    createStoreShipping(@CurrentUser('id') userId: string, @Body() dto: CreateStoreShippingDto) {
        return this.shippingService.createStoreShipping(userId, dto);
    }

    @Put('store/:id')
    @Roles('SUPERADMIN', 'ADMIN', 'STORE')
    @ApiOperation({ summary: 'ویرایش روش ارسال (Admin & Store) (storeShippingMethodId)' })
    updateStoreShipping(@Param('id') id: string, @Body() dto: UpdateStoreShippingDto) {
        return this.shippingService.updateStoreShipping(id, dto);
    }

    @Delete('store/:id')
    @Roles('SUPERADMIN', 'ADMIN', 'STORE')
    @ApiOperation({ summary: 'حذف روش ارسال (Admin & Store) (storeShippingMethodId)' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    removeStoreShipping(@Param('id') id: string) {
        return this.shippingService.removeStoreShipping(id);
    }

    /// ثبت قیمت مختص به استان ها StoreShippingRate ///
    @Get('store/:id')
    @Roles('SUPERADMIN', 'ADMIN', 'STORE')
    @ApiOperation({ summary: 'لیست استان های روش ارسال فروشنده (Admin & Store) (ShippingRate)', description: 'دریافت جزئیات روش ارسالی فروشنده که میتونه کل استان ها با قیمت های مشخص باشه یا این که بعضی از استان های دور دست باشه فقط' })
    @ApiOkResponse({ type: [ShippingRateEntity] })
    getOneStoreShipping(@Param('id') id: string) {
        return this.shippingService.getOneStoreShipping(id);
    }

    @Post('rate/')
    @Roles('SUPERADMIN', 'ADMIN', 'STORE')
    @ApiOperation({ summary: 'ساخت متود روش ارسال (استان)(Admin & Store) (ShippingRate)', description: 'تمام اطلاعات باید ارسال بشه' })
    createShippingRate(@Body() dto: CreateStoreShippingRateDto) {
        return this.shippingService.createShippingRate(dto);
    }

    @Put('rate/:id')
    @Roles('SUPERADMIN', 'ADMIN', 'STORE')
    @ApiOperation({ summary: 'ویرایش متود روش ارسال (استان)(Admin & Store) (ShippingRate)' })
    updateShippingRate(@Param('id') id: string, @Body() dto: CreateStoreShippingRateDto) {
        return this.shippingService.updateShippingRate(id, dto);
    }

    @Delete('rate/:id')
    @Roles('SUPERADMIN', 'ADMIN', 'STORE')
    @ApiOperation({ summary: 'ویرایش متود روش ارسال (استان)(Admin & Store) (ShippingRate)' })
    @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
    removeShippingRate(@Param('id') id: string) {
        return this.shippingService.removeShippingRate(id);
    }
}