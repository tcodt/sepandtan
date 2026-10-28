import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CountriesService } from './country.service.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CountryEntity, CountryPublicEntity } from './entities/country.entities.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { CountrySearchDto, CreateCountryDto, UpdateCountryDto } from './dto/country.dto.js';

@ApiTags('Countries')
@ApiBearerAuth()
@Controller('country')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) { }

  @Get()
  @ApiOperation({ summary: 'لیست کشورها برای نمایش به تمام کاربران (Public)' })
  @ApiOkResponse({ type: [CountryPublicEntity] })
  async findAll() {
    return this.countriesService.findAll();
  }

  @Get('/admin')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: PaginatedResponse(CountryEntity, 'countries') })
  @ApiOperation({ summary: 'لیست کشورها (Admin)' })
  async findAllAdmin(@Query() query: CountrySearchDto) {
    return this.countriesService.findAllAdmin(query);
  }

  @Post()
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'ایجاد کشور جدید (Admin)' })
  async create(@Body() dto: CreateCountryDto) {
    return this.countriesService.create(dto);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Put(':id')
  @ApiOperation({ summary: 'ویرایش کشور (Admin)' })
  async update(@Param('id') id: string, @Body() dto: UpdateCountryDto) {
    return this.countriesService.update(id, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'حذف کشور (Admin)' })
  async delete(@Param('id') id: string) {
    return this.countriesService.delete(id);
  }
}