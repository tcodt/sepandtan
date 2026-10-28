import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CreateProductDto, UpdateProductDto, ProductFilterDto, ProductSearchDto } from './dto/product.dto.js';
import { ProductsService } from './products.service.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { AdminProductDetailEntity, ProductListEntity } from './entities/product.entity.js';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) { }
  @Get()
  @ApiOkResponse({ type: PaginatedResponse(ProductListEntity, 'products') })
  @ApiOperation({ summary: 'لیست محصولات با فیلتر (Public)', description: 'تمام کاربران بهش دسترسی دارن' })
  async findAll(@Query() filters: ProductFilterDto) {
    return this.productsService.findAll(filters);
  }

  @Get('ADMIN')
  @UseGuards(AccessTokenGuard)
  @Roles('STORE', 'ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: PaginatedResponse(AdminProductDetailEntity, 'products') })
  @ApiOperation({ summary: 'لیست تمام محصولات (Admin & Store)', description: 'از این فانکشن هم برای نمایش محصولات به ادمین و هم فروشنده استفاده میکنیم ولی حواست باشه زمانی که برای فروشنده استفاده میکنیم ایدی فروشگاه رو همیشه توی سرچ به صورت دیفالت بفرسته که فقط محصولات خودشو ببینه نه ماله همه رو' })
  async getProducts(@Query() query: ProductSearchDto) {
    return this.productsService.getProducts(query);
  }

  @Patch('admin/:id/approve')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'تأیید محصول (Admin)', description: 'فقط ادمین دسترسی داره تایید بزنه و فروشنده محصولاتشو میزاره و ادمین تایید میکنه' })
  async approveProduct(@Param('id') id: string) {
    return this.productsService.approveProduct(id);
  }

  @Patch('admin/:id/feature')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'ویژه کردن / غیر ویژه کردن محصول (Admin)' })
  async featureProduct(@Param('id') id: string) {
    return this.productsService.featureProduct(id);
  }

  @Get(':idOrSlug')
  @ApiOperation({ summary: 'جزئیات محصول (Public)', description: 'تمام کاربران بهش دسترسی دارن و برای سینگل پیج هستش حتما حتما برای نمایش کاربر از اسلاگ استفاده کن نه آیدی واسه سئو خیلی خوبه' })
  async findOneOrBySlug(@Param('idOrSlug') idOrSlug: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const product = uuidRegex.test(idOrSlug)
      ? await this.productsService.findOne(idOrSlug)
      : await this.productsService.findBySlug(idOrSlug);
    this.productsService.incrementViewCount(product.id);
    return product;
  }

  @Get(':slug/related')
  @ApiOperation({ summary: 'محصولات مرتبط (Public)',description:'با ارسال اسلاگ محصولاتی که بیشترین فروش رو داشتن و داخل همین دسته بندی هستن رو میاد پیداش میکنه' })
  async getRelated(@Param('slug') slug: string) {
    return this.productsService.getRelated(slug);
  }

  @Post('/')
  @UseGuards(AccessTokenGuard)
  @Roles('STORE', 'ADMIN', 'SUPERADMIN')
  @ApiOperation({
    summary: 'ثبت محصول جدید (Admin & Store)', description: `
    * زمانی که فروشنده میخواد محصول ثبت بکنه دیگه نیازی نیست که آیدی فروشگاه رو برام بفرستی 
    * زمانی که ادمین میخواد از طرف یه فروشنده دیگه محصولی رو ثبت بکنه اون موقع آیدی فروشگاه رو واسم بفرست این واسه زمانیه که فروشنده دسترسی نداره یا مشکلی براش پیش اومده
    * زمانی که ادمین میخواد از فروشگاه خودش محصولی رو ثبت بکنه نیازی نداره که بیاد آیدی فروشگاه رو ارسال بکنه
    ` })
  async create(@Body() dto: CreateProductDto, @CurrentUser('id') id: string) {
    return this.productsService.create(dto, id);
  }

  @Put(':id')
  @UseGuards(AccessTokenGuard)
  @Roles('STORE', 'ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'ویرایش محصول (Admin & Store)', description: 'هر چیزی که ارسال نکنی ویرایش نمیشه' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AccessTokenGuard)
  @Roles('STORE', 'ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'حذف محصول (Admin & Store)' })
  async delete(@Param('id') id: string) {
    return this.productsService.delete(id);
  }
}
