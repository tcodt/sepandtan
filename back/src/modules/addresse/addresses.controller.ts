/**
 * AddressesController - کنترلر مدیریت آدرس‌های کاربران
 */
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AddressesService } from './addresses.service.js';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';


@ApiTags('Addresse')
@Controller('addresse')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  @ApiOperation({ summary: 'ایجاد آدرس جدید (User)' ,description:'کاربر مجاز به ساخت بیش از 10 آدرس نیست محدودیت بزار' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'لیست تمام آدرس‌های کاربر (User)' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.addressesService.getUserAddresses(userId);
  }

  @Get('default')
  @ApiOperation({ summary: 'آدرس پیش‌ فرض کاربر (User)' })
  async getDefault(@CurrentUser('id') userId: string) {
    return this.addressesService.getDefaultAddress(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'جزئیات آدرس (User)' })
  async findOne(@Param('id') addressId: string, @CurrentUser('id') userId: string) {
    return this.addressesService.findOne(addressId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'به‌روزرسانی آدرس (User)' })
  async update(@Param('id') addressId: string, @CurrentUser('id') userId: string, @Body() dto: UpdateAddressDto) {
    return this.addressesService.update(addressId, userId, dto);
  }

  @Put(':id/set-default')
  @ApiOperation({ summary: 'تنظیم آدرس به عنوان پیش‌ فرض (User)' })
  async setDefault(@Param('id') addressId: string, @CurrentUser('id') userId: string) {
    return this.addressesService.setDefault(addressId, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'حذف آدرس (User)' })
  async delete(@Param('id') addressId: string, @CurrentUser('id') userId: string) {
    return this.addressesService.delete(addressId, userId);
  }
}