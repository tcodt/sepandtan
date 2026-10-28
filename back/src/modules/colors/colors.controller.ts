import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { ColorsService } from './colors.service.js';
import { CreateColorDto, UpdateColorDto } from './dto/color.dto.js';
import { ColorSearchDto } from './dto/color.search.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { ColorEntity, ColorPublicEntity } from './entities/color.entities.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';

@ApiTags('Colors')
@Controller('colors')
export class ColorsController {
  constructor(private readonly colorsService: ColorsService) { }

  @Get()
  @ApiOperation({ summary: 'لیست رنگ‌ها برای نمایش به تمام کاربران و گذاشتن داخل فرم های انتخاب گر (Public)' })
  @ApiOkResponse({ type: [ColorPublicEntity] })
  async findAll() {
    return this.colorsService.findAll();
  }

  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get('/admin')
  @ApiOkResponse({ type: PaginatedResponse(ColorEntity, 'colors') })
  @ApiOperation({ summary: 'لیست رنگ‌ها (Admin)' })
  async findAllAdmin(@Query() query: ColorSearchDto) {
    return this.colorsService.findAllAdmin(query);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ایجاد رنگ جدید (Admin)' })
  async create(@Body() dto: CreateColorDto) {
    return this.colorsService.create(dto);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ویرایش رنگ (Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateColorDto) {
    return this.colorsService.update(id, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف رنگ (Admin)' })
  async delete(@Param('id') id: string) {
    return this.colorsService.delete(id);
  }
}