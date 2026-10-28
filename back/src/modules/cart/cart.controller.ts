/**
 * CartController - کنترلر سبد خرید
 */
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CartService } from './cart.service.js';
import { AddToCartDto, UpdateCartItemDto } from './dto/cart.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CartResponseEntity } from './entities/cart.entity.js';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) { }
  @Get()
  @ApiOperation({ summary: 'مشاهده سبد خرید (User)', description: 'کاربر میتونه همزمان از چندتا فروشگاه خرید کنه و روش ارسال های متفاوت هم بزنه' })
  @ApiOkResponse({ type: CartResponseEntity })
  async getCart(@CurrentUser('id') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post()
  @ApiOperation({ summary: 'افزودن به سبد خرید (User)', description: 'حتما باید آیدی وریانت رو بفرستی محاسبه هزینه ها و چیزای دیگه سمت بک اند انجام میشه' })
  async addItem(@CurrentUser('id') userId: string, @Body() dto: AddToCartDto) {
    return this.cartService.addItem(userId, dto);
  }


  @Delete()
  @ApiOperation({ summary: 'خالی کردن سبد خرید (User)', description: 'تمام سبد خرید کاربر خالی میشه و دیگه هیچ محصولی برای خرید نداره' })
  async clearCart(@CurrentUser('id') userId: string) {
    return this.cartService.clearCart(userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'به‌روزرسانی تعداد آیتم (User)',description:'آیدی کارت رو باید بفرستی و  دونه به دونه آپدیت نمیشه میتونی کم یا زیاد بکنی یعنی بزنی 10 تا یکدفعه ای یا بکنیش 2 تا میتونی بزاری کاربر هر یه دونه که زد بیشتر بشه این هم یه عدد بیشتر بکنه راحت تره' })
  async updateItem(@Param('id') id: string, @Body() dto: UpdateCartItemDto) {
    return this.cartService.updateItem(id, dto);
  }

  @Delete('/:id')
  @ApiOperation({ summary: 'حذف آیتم از سبد خرید (User)',description:'حواست باشه آیدی cart رو باید بفرستی' })
  async removeItem(@Param('id') id: string) {
    return this.cartService.removeItem(id);
  }
}
