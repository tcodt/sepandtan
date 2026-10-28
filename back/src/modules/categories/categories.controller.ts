/**
 * CategoriesController - کنترلر دسته‌بندی‌ها
 */
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto, SearchCategoryPublic, UpdateCategoryDto } from './dto/category.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CategoryAdminEntity, CategorySelectorEntity, CategoryTreeEntity } from './entities/category.entities.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';


@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) { }

  /**
   * دریافت تمام دسته‌بندی‌های فعال - عمومی
   */
  @Get()
  @ApiOkResponse({ type: [CategoryTreeEntity] })
  @ApiOperation({ summary: 'لیست دسته‌بندی‌های فعال (درختی) (Public)' })
  async findAll() {
    return this.categoriesService.findAll();
  }

  /**
 * دریافت تمام دسته‌بندی‌های فعال - عمومی
 */
  @Get('/selector')
  @ApiOkResponse({ type: [CategorySelectorEntity] })
  @ApiOperation({ summary: ' (Public) لیست دسته‌بندی‌های فعال برای فرم های انتخاب گر' })
  async findNotChildren(@Query() query: SearchCategoryPublic) {
    return this.categoriesService.findNotChildren(query);
  }

  /**
 *دریافت تمام دسته‌بندی ادمین
 */
  @Get('/admin')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'لیست دسته‌بندی‌های توسط ادمین (Admin)', description: 'دسته بندی ها با تمام جزئیات و زیر مجموعه هاشون' })
  @ApiOkResponse({ type: PaginatedResponse(CategoryAdminEntity, 'category') })
  async findAllAdmin(@Query() query: QueryDefaultDto) {
    return this.categoriesService.findAllAdmin(query);
  }

  /**
   * دریافت یک دسته‌بندی با slug - عمومی
   */
  @Get(':slug')
  @ApiOperation({ summary: 'جزئیات دسته‌بندی با محصولات (Public)' })
  async findBySlug(@Param('slug') slug: string) {
    return this.categoriesService.findBySlug(slug);
  }

  /**
   * ایجاد دسته‌بندی جدید - فقط ادمین
   */
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ایجاد دسته‌بندی جدید (Admin)', description: 'به جز اسم بقیه بخش ها ضروری نیستن' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  /**
   * ویرایش دسته‌بندی - فقط ادمین
   */
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ویرایش دسته‌بندی (Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  /**
   * حذف دسته‌بندی - فقط ادمین
   */
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف دسته‌بندی (Admin)' })
  async delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
