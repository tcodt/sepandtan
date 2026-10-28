import { Controller, Get, Post, Delete, Put, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service.js';
import { CreateDiscountDto, SearchDiscountDto } from './dto/discount.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ValidateDiscountDto } from './dto/validate.discount.dto.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { DiscountEntity, DiscountSelectorEntity } from './entities/discount.entity.js';


@ApiTags('Discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) { }

  @Post('validate')
  @UseGuards(AccessTokenGuard)
  @ApiOperation({
    summary: 'تایید کردن کد تخفیف (Users)', description:
      `
    * برای تایید کردن کد تخفیف اطلاعات سبد خرید رو همینطوری که توی بادی هستش قرار بده
    * سمت بک اند میاد چک میکنه و یه خروجی شبیه به همین درست میکنه که میتونی قیمت های مشخص شده رو به کاربر نمایش بدی
    ` })
  async validate(@Body() body: ValidateDiscountDto, @CurrentUser('id') userId: string) {
    return this.discountsService.validate(body, userId);
  }

  @Get()
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'STORE')
  @ApiOkResponse({ type: PaginatedResponse(DiscountEntity, 'discounts') })
  @ApiOperation({
    summary: 'لیست کدهای تخفیف (Admin & Store)', description: `
    * کدهای تخفیف 4 نوع دارن 
    * 1 تخفیف پلتفرم این نوع تخفیف برای تمام وب سایت هستش و کاربر باید کد تخفیف ثبت بکنه و همه فروشگاه ها واجد شرایط تخفیف هستن
    * 2 تخفیف کمیسیون که کاربر باید کد تخفیف ثبت بکنه این نوع تخفیف مربوط میشه به مدیریت سایت اینطوری که هزینه تخفیف فقط از کمیسیونی که فروشنده ها به وب سایت میدن کم میشه در واقع فروشنده هیچ ضرری نمیکنه
    * 3 تخفیف فروشنده ، کاربر باید کد تخفیف ثبت بکنه فروشگاه هایی که موقع ثبت تخفیف ارسال شدن فقط از اون فروشنده ها تخفیف گرفته میشود نه از همه 
    * 4 تخفیف محصولات این نوع تخفیف توسط فروشنده ثبت میشه و به صورت دونه دونه باید روی محصولات اونم توی وریانت یا همون ویژگی های محصولات ثبت میشه و این که این تخفیف نیازی به کد نداره و میتونه همراه با بقیه تخفیف ها جمع بشه چون به صورت دیفالت روی محصولات هستش
    ` })
  async findAll(@Query() query: SearchDiscountDto) {
    return this.discountsService.findAll(query);
  }

  @Get('list')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'STORE')
  @ApiOkResponse({ type: DiscountSelectorEntity })
  @ApiOperation({ summary: 'نمایش تخفیف های محصولات (Admin & Store)' ,description:'نمایش همه تخفیف ها از نوع محصولات یا پروداکت برای نمایش در فرم های انتخاب گر'})
  async listDiscount() {
    return this.discountsService.listDiscount();
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'STORE')
    @ApiOperation({
    summary: 'ایجاد کد تخفیف جدید (Admin & Store)', description: `
    * کدهای تخفیف 4 نوع دارن 
    * 1 تخفیف پلتفرم این نوع تخفیف برای تمام وب سایت هستش و کاربر باید کد تخفیف ثبت بکنه و همه فروشگاه ها واجد شرایط تخفیف هستن
    * 2 تخفیف کمیسیون که کاربر باید کد تخفیف ثبت بکنه این نوع تخفیف مربوط میشه به مدیریت سایت اینطوری که هزینه تخفیف فقط از کمیسیونی که فروشنده ها به وب سایت میدن کم میشه در واقع فروشنده هیچ ضرری نمیکنه
    * 3 تخفیف فروشنده ، کاربر باید کد تخفیف ثبت بکنه فروشگاه هایی که موقع ثبت تخفیف ارسال شدن فقط از اون فروشنده ها تخفیف گرفته میشود نه از همه 
    * 4 تخفیف محصولات این نوع تخفیف توسط فروشنده ثبت میشه و به صورت دونه دونه باید روی محصولات اونم توی وریانت یا همون ویژگی های محصولات ثبت میشه و این که این تخفیف نیازی به کد نداره و میتونه همراه با بقیه تخفیف ها جمع بشه چون به صورت دیفالت روی محصولات هستش
    * ایجاد کد های تخفیف به صورت یکتا هستش و نباید دوباره تکرار بشن
    ` })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateDiscountDto) {
    return this.discountsService.create(userId, dto);
  }

  @Patch(':discountId')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'STORE')
  @ApiOperation({ summary: 'ویرایش کد تخفیف (Admin & Store)' ,description:''})
  async update(@Param('discountId') discountId: string, @Body() dto: CreateDiscountDto) {
    return this.discountsService.update(discountId, dto);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'STORE')
  @ApiOperation({ summary: 'حذف کد تخفیف (Admin & Store)' })
  async delete(@Param('id') id: string) {
    return this.discountsService.delete(id);
  }

  @Put(':id/toggle')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN', 'STORE')
  @ApiOperation({ summary: 'فعال/غیرفعال کردن کد تخفیف (Admin & Store)' })
  async toggleActive(@Param('id') id: string) {
    return this.discountsService.toggleActive(id);
  }
}
