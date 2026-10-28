import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiOkResponse } from '@nestjs/swagger';

import { CreateProductVariantDto, UpdateProductVariantDto } from './dto/ProductVariant.dto.js';
import { VariantsService } from './variants.service.js';
import { AttributeDefinitionDto, AttributeDefinitionSearch } from './dto/AttributeDefinition.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { AttributeEntity, ProductVariantEntity } from './entities/variants.entitye.js';

@ApiTags('Variants')
@Controller('variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) { }
  /** ############### AttributeDefinition (روت‌های ثابت باید قبل از :id بیان) ############### */

  @UseGuards(AccessTokenGuard)
  @Roles('STORE', 'ADMIN', 'SUPERADMIN')
  @Get('attribute-definition')
  @ApiBearerAuth()
  @ApiOkResponse({ type: AttributeEntity })
  @ApiOperation({
    summary: 'دریافت لیست AttributeDefinition (Admin , Store)', description:
      `
    * این بخش خیلی مهمه
    * این فانکنشن رو هم میتونی برای ساخت محصول استفاده کنی و هم برای نمایش وریانت هایی که ساخته شده توی دو جا کاربرد داره 
    * کاربرد 1 میای صفحه وریانت هارو میسازی که ادمین بهش دسترسی داره و اونجا تمام وریانت ها رو بهش نشون میدی که بتونه ویرایش بکنه
    * کاربرد 2 وقتی که یه محصول ساخته شد ایدی محصول و دسته محصول رو میفرستی توی سرچ همین قابلیت نمایش دیتیل هم برمیداری که سرور اذیت نشه خیلی مهمه این کار بعدش تمام وریانت های مربوط به اون محصول رو میبینی که میتونی توی ویژگی های محصولت اضافه کنی
    * لیست تمام وریانت های ساخته شده که اگر میخواستی به صورت انتخابگر نمایش بدی noDetail رو بزن برای نمایش وریانت های محصول توی صفحه محصول هم فعالش کن که دسته بندی هارو نفرسته
    ` })
  async getAttributeDefinition(@Query() query: AttributeDefinitionSearch) {
    return this.variantsService.getAttributeDefinition(query);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Post('attribute-definition')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ایجاد AttributeDefinition (Admin)', description: 'این قسمت برای هر دسته مشخص میایم یه تعداد ویژگی در نظر میگیریم باید ویژگی هایی باشه که توی قیمت تاثیر بزاره و اینکه میشه برای چند تا دسته هم ثبتش کرد مثلا برای دسته بندی گوشی رم ،حافظه' })
  async createAttributeDefinition(@Body() body: AttributeDefinitionDto) {
    return this.variantsService.createAttributeDefinition(body);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('STORE', 'ADMIN', 'SUPERADMIN')
  @Put('attribute-definition/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ویرایش AttributeDefinition (Admin , Store)', description: 'با نفرستادن دسته بندی ها تمام دسته های اون وریانت حذف میشه کلید باید به صورت یونیک باشه' })
  async updateAttributeDefinition(@Param('id') id: string, @Body() body: AttributeDefinitionDto) {
    return this.variantsService.updateAttributeDefinition(id, body);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Delete('attribute-definition/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف AttributeDefinition (Admin)', description: 'برای حذف نباید هیچ محصولی بهش متصل باشه' })
  async deleteAttributeDefinition(@Param('id') id: string) {
    return this.variantsService.deleteAttributeDefinition(id);
  }

  /** ############### Variant (روت داینامیک :id/:variantId — باید آخر بمونه) ############### */
  @Get(':id')
  @UseGuards(AccessTokenGuard)
  @Roles('STORE', 'ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: ProductVariantEntity })
  @ApiOperation({ summary: 'دریافت لیست Variantهای یک محصول', description: 'با ارسال آیدی محصول' })
  async getVariants(@Param('id') id: string) {
    return this.variantsService.getVariants(id);
  }

  @Post('/')
  @UseGuards(AccessTokenGuard)
  @Roles('STORE', 'ADMIN', 'SUPERADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ایجاد Variant محصول (Admin , Store)', description: ` فروشنده میاد برای انواع سایز و رنگ و قیمت و موجودی جدا میتونه بزنه و کاملا شخصی سازی بکنه` })
  @ApiBody({ type: CreateProductVariantDto })
  async createVariant(@Body() dto: CreateProductVariantDto) {
    return this.variantsService.createVariant(dto);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('STORE', 'ADMIN', 'SUPERADMIN')
  @Put(':variantId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ویرایش Variant (Admin , Store)' })
  async updateVariant(@Param('variantId') variantId: string, @Body() dto: UpdateProductVariantDto) {
    return this.variantsService.updateVariant(variantId, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('STORE', 'ADMIN', 'SUPERADMIN')
  @Delete(':variantId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف Variant (Admin , Store)' })
  async deleteVariant(@Param('variantId') variantId: string) {
    return this.variantsService.deleteVariant(variantId);
  }
}