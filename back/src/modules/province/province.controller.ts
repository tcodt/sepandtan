import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiExtraModels, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ProvinceService } from './province.service.js';
import type { Request } from 'express';
import { CreateCityDto, CreateProvinceDto, GetCityByProvinceId, UpdateCityDto } from './dtos/create.province.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

/** * کنترلر برای ساخت و آپدیت تمام استان‌های سایت */
@ApiTags('Province')
@Controller('province')
export class ProvinceController {
  constructor(private readonly ProvinceService: ProvinceService) { }

  /**
   * دریافت همه استان‌ها
   */
  @Get('/')
  @ApiOperation({
    summary: 'Get all provinces (Public)',
    description: 'دریافت لیست تمام استان ها دسترسی: تمام کاربران میتونی ازش توی انتخابگر ها استفاده کنی'
  })
  getProvince() {
    return this.ProvinceService.getAllProvince();
  }

  /**
   * ایجاد استان جدید
   */
  @Post('/')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({
    summary: 'Create a new province (Admin)',
    description: 'ایجاد استان جدید در سایت. دسترسی: فقط ادمین و سوپر ادمین'
  })
  @ApiBody({ type: CreateProvinceDto, description: 'اطلاعات استان جدید باید ارسال شود' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  PostProvince(@Body() Province: CreateProvinceDto) {
    return this.ProvinceService.createProvince(Province);
  }

  /**
   * حذف استان با ایدی
   */
  @Delete('/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({
    summary: 'Delete province by ID (Admin)',
    description: 'حذف استان از دیتابیس با استفاده از ایدی. دسترسی: فقط ادمین و سوپر ادمین. در صورت وجود شهر یا پورتفولیو یا پروژه مرتبط با این استان، عملیات با خطا مواجه می‌شود.'
  })
  @ApiParam({ name: 'id', description: 'ایدی عددی استان مورد نظر برای حذف' })
  @ApiOkResponse({ schema: { example: { success: true } }, description: 'پیام تایید حذف' })
  deleteProvince(@Param('id') id: string) {
    return this.ProvinceService.deleteProvince(id);
  }

  /**
   * بروزرسانی استان
   */
  @Put('/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({
    summary: 'Update province information (Admin)',
    description: 'بروزرسانی اطلاعات استان. دسترسی: ادمین و سوپر ادمین. همه فیلدها اختیاری هستند و فقط فیلدهای ارسال شده به‌روز می‌شوند. برای ویرایش، ایدی استان در مسیر ارسال شود.'
  })
  @ApiParam({ name: 'id', description: 'ایدی استان مورد نظر برای ویرایش' })
  @ApiBody({ type: CreateProvinceDto, description: 'فیلدهای قابل ویرایش: تمام اطلاعات استان' })
  @ApiOkResponse({ schema: { example: { success: true } }, description: 'پیام تایید ویرایش' })
  updateProvince(@Body() body: CreateProvinceDto, @Param('id') id: string) {
    return this.ProvinceService.updateProvince(body, id);
  }

  /**
   * دریافت همه شهرها
   */
  @Get('/city')
  @ApiOperation({
    summary: 'Get all cities (Public)',
    description: 'دریافت لیست تمام شهرها دسترسی: تمام کاربران و دریافت با آیدی '
  })
  getCity(@Query() query: GetCityByProvinceId) {
    return this.ProvinceService.getAllCity(query);
  }

  /**
   * ایجاد شهر جدید
   */
  @Post('/city')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({
    summary: 'Create a new city (Admin)',
    description: 'ایجاد شهر جدید در سایت. دسترسی: فقط ادمین و سوپر ادمین'
  })
  @ApiBody({ type: CreateCityDto, description: 'اطلاعات شهر جدید باید ارسال شود' })
  @ApiOkResponse({ schema: { example: { success: true } }, description: 'در صورت موفقیت، پیام تایید برگردانده می‌شود' })
  PostCity(@Body() City: CreateCityDto) {
    return this.ProvinceService.createCity(City);
  }

  /**
   * حذف شهر با ایدی
   */
  @Delete('/city/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({
    summary: 'Delete city by ID (Admin)',
    description: 'حذف شهر از دیتابیس با استفاده از ایدی. دسترسی: فقط ادمین و سوپر ادمین. در صورت وجود پورتفولیو یا پروژه یا کاربر مرتبط با این شهر، عملیات با خطا مواجه می‌شود.'
  })
  @ApiParam({ name: 'id', description: 'ایدی عددی شهر مورد نظر برای حذف' })
  @ApiOkResponse({ schema: { example: { success: true } }, description: 'پیام تایید حذف' })
  deleteCity(@Param('id') id: string) {
    return this.ProvinceService.deleteCity(id);
  }

  /**
   * بروزرسانی شهر
   */
  @Put('/city/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({
    summary: 'Update city information (Admin)',
    description: 'بروزرسانی اطلاعات شهر. دسترسی: ادمین و سوپر ادمین. همه فیلدها اختیاری هستند و فقط فیلدهای ارسال شده به‌روز می‌شوند. برای ویرایش، ایدی شهر در مسیر ارسال شود.'
  })
  @ApiParam({ name: 'id', description: 'ایدی شهر مورد نظر برای ویرایش' })
  @ApiBody({ type: UpdateCityDto, description: 'فیلدهای قابل ویرایش: تمام اطلاعات شهر' })
  @ApiOkResponse({ schema: { example: { success: true } }, description: 'پیام تایید ویرایش' })
  updateCity(@Body() body: UpdateCityDto, @Param('id') id: string) {
    return this.ProvinceService.updateCity(body, id);
  }
}