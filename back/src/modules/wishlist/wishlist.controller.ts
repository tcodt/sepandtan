/**
 * WishlistController - کنترلر علاقه‌مندی‌ها
 */
import { Controller, Get, Post, Delete, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { WishlistEntity } from './entities/wishlist.entity.js';


@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(AccessTokenGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) { }

  @Get()
  @ApiOperation({ summary: 'لیست علاقه‌مندی‌ها (Users)' })
  @ApiOkResponse({ type: PaginatedResponse(WishlistEntity, 'wishlist') })
  async getWishlist(@CurrentUser('id') userId: string, @Query('page') page?: number) {
    return this.wishlistService.getUserWishlist(userId, page);
  }

  @Get('ids')
  @ApiOperation({
    summary: 'تمام آیدی محصولات علاقه مندی شده (Users)', description: `
    * کاربر وقتی لاگین میکنه یه نگاه میندازی ببینی لیست این آیدی هارو داری یا نه اگر نداشتی که یه درخواست میزنی میگیری
    * این ایدی هارو اول توی لوکال استوریج ذخیره میکنی بعدش میای توی خود برنامه ذخیره میکنی که با رفرش هم پاک میشه 
    * کاربر محصولی اضافه کرد یا حذف کرد باید بیای لیست آیدی هارو تغییر بدی و جدید بگیری
    * بعدش موقع نمایش محصولات یه حلقه ساده درست کن که این آیدی هارو توی برنامه ذخیره داری چک بکنه ببینه محصولات جزو علاقه مندی هاش هستن یا نه سعی کن توی کامپوننت جدا درست کنی که سرعت محصولات رو نیاره پایین
    ` })
  @ApiOkResponse({ example: ['8351bf0e-0cc9-4db3-8db3-677739fb4039'] })
  async allIds(@CurrentUser('id') userId: string) {
    return this.wishlistService.getAllIds(userId);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'افزودن به علاقه‌مندی‌ها (Users)' })
  async add(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.addItem(userId, productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'حذف از علاقه‌مندی‌ها (Users)' })
  async remove(@CurrentUser('id') userId: string, @Param('productId') productId: string) {
    return this.wishlistService.removeItem(userId, productId);
  }
}
