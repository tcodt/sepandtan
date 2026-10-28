import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { BrandService } from './brand.service.js';
import { BrandDto } from './dto/brand.dts.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { BrandAdminEntity, BrandEntity } from './entities/brand.entities.dto.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';

@ApiTags('Brand')
@Controller('brand')
export class BrandsController {
    constructor(private readonly brandsService: BrandService) { }

    /**
     * دریافت تمام برند‌های فعال - عمومی
     */
    @Get()
    @ApiOperation({ summary: 'لیست برند ها برای تمام برند ها (Public)', description: 'لیست برندها برای فرم انتخاب گر' })
    @ApiOkResponse({ type: [BrandEntity] })
    async findAll() {
        return this.brandsService.findAll();
    }

    @Get('/admin')
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN', 'STORE')
    @ApiOkResponse({ type: PaginatedResponse(BrandAdminEntity, 'brands') })
    @ApiOperation({ summary: 'لیست برند‌های (Store & Admin)' })
    async findAllAdmin(@Query() query: QueryDefaultDto) {
        return this.brandsService.findAllAdmin(query);
    }

    /**
     * ایجاد برند جدید - فقط ادمین
     */
    @Post()
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ایجاد برند جدید (Admin)' })
    async create(@Body() dto: BrandDto) {
        return this.brandsService.create(dto);
    }

    /**
     * ویرایش برند - فقط ادمین
     */
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @Put(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'ویرایش برند (Admin)' })
    async update(@Param('id') id: string, @Body() dto: BrandDto) {
        return this.brandsService.update(id, dto);
    }

    /**
     * حذف برند - فقط ادمین
     */
    @UseGuards(AccessTokenGuard)
    @Roles('ADMIN', 'SUPERADMIN')
    @Delete(':id')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'حذف برند (Admin)' })
    async delete(@Param('id') id: string) {
        return this.brandsService.delete(id);
    }
}
