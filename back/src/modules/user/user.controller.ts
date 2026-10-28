import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { UserEntity, UserProfileResponseDto } from './entities/user.entities.js';
import type { Request } from 'express';
import { GetPendingCoach, GetPendingStore, QueryUserDto } from './dtos/query.user.js';
import { UpdateCoachByAdminDto, UpdateProfileDto, UpdateStoreByAdminDto, UpdateUserDto } from './dtos/update.user.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CreateCoachDto } from '../coach/dto/coach.dto.js';
import { CreateStoreDto } from '../store/dto/store.dto.js';

/** * کنترلر برای ساخت و اپدیت تمام کاربران سایت */
@ApiBearerAuth()
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }
  /// Profile ///

  @Get('/profile')
  @UseGuards(AccessTokenGuard)
  @Roles('USER', 'SUPERADMIN', 'ADMIN', 'AUTHOR', 'STORE', 'COACH')
  @ApiOperation({ summary: 'get Profile', description: 'دسترسی : تمام نقش های احراز هویت شده' })
  @ApiOkResponse({ type: UserProfileResponseDto })
  async getProfile(@CurrentUser('id') id?: string) {
    return this.userService.getProfile(id)
  }

  @Get('/profile/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: UserProfileResponseDto })
  @ApiOperation({ summary: 'Get Profile By Admin', description: 'دسترسی : ادمین و سوپر ادمین' })
  getProfileByAdmin(@Param('id') id: string) {
    return this.userService.getProfileByAdmin(id)
  }

  @Put('/profile')
  @UseGuards(AccessTokenGuard)
  @Roles('USER', 'SUPERADMIN', 'ADMIN', 'AUTHOR', 'STORE', 'COACH')
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiOperation({
    summary: 'Update Or Create Profile',
    description: 'دسترسی : تمام نقش های احراز هویت شده ساخت پروفایل یا آپدیت ',
  })
  @ApiBody({ type: UpdateProfileDto, description: 'آپدیت اطلاعات پروفایل' })
  updateOrCreateProfile(@Body() body: UpdateProfileDto, @CurrentUser('id') id: string) {
    return this.userService.updateOrCreateProfile(body, id);
  }

  @Put('/profile/:idUser')
  @UseGuards(AccessTokenGuard)
  @Roles('SUPERADMIN')
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiOperation({
    summary: 'update user By Super Admin',
    description: 'دسترسی : سوپر ادمین'
  })
  @ApiBody({ type: UpdateProfileDto, description: 'آپدیت اطلاعات اصلی کاربر' })
  updateProfileByAdmin(@Body() body: UpdateProfileDto, @Param('idUser') id: string) {
    return this.userService.updateOrCreateProfile(body, id)
  }

  /// Store ///
  @Get('/store')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: PaginatedResponse(UserProfileResponseDto, 'store') })
  @ApiOperation({ summary: 'Get All Store Pending By Admin', description: 'دسترسی : ادمین و سوپر ادمین ، لیست فروشندگان تایید نشده' })
  getPendingStore(@Query() query: GetPendingStore) {
    return this.userService.getPendingStore(query)
  }

  @Post('store')
  @UseGuards(AccessTokenGuard)
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiOperation({
    summary: 'create request Store by user',
    description: 'دسترسی : تمام نقش های احراز هویت شده'
  })
  @ApiBody({ type: CreateStoreDto, description: 'با ارسال اطلاعات درخواست برای فروشنده شدن توسط کاربر ایجاد میشود و ادمین باید تایید کند' })
  requestAddStore(@Body() body: CreateStoreDto, @Query('userId') id: string) {
    return this.userService.requestAddStore(body, id)
  }

  @Patch('store/:storeId')
  @UseGuards(AccessTokenGuard)
  @Roles('SUPERADMIN')
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiOperation({
    summary: 'update user By Super Admin',
    description: 'دسترسی : سوپر ادمین'
  })
  @ApiBody({ type: UpdateStoreByAdminDto, description: 'آپدیت اطلاعات اصلی کاربر مثلا تایید و رد صلاحیت فروشنده' })
  updateStoreStatus(@Body() body: UpdateStoreByAdminDto, @Param('storeId') storeId: string) {
    return this.userService.updateStoreStatus(body, storeId)
  }

  /// Coach ///
  @Get('/coach')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: PaginatedResponse(UserProfileResponseDto, 'coach') })
  @ApiOperation({ summary: 'Get All Coach Pending By Admin', description: 'دسترسی : ادمین و سوپر ادمین ، لیست مربی های تایید نشده' })
  getPendingCoach(@Query() query: GetPendingCoach) {
    return this.userService.getPendingCoach(query)
  }

  @Post('coach')
  @UseGuards(AccessTokenGuard)
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiOperation({
    summary: 'create request coach by user',
    description: 'دسترسی : تمام نقش های احراز هویت شده'
  })
  @ApiBody({ type: CreateCoachDto, description: 'با ارسال اطلاعات درخواست برای مربی شدن توسط کاربر ایجاد میشود و ادمین باید تایید کند' })
  requestAddCoach(@Body() body: CreateCoachDto, @Query('userId') id: string) {
    return this.userService.requestAddCoach(body, id)
  }

  @Patch('coach/:coachId')
  @UseGuards(AccessTokenGuard)
  @Roles('SUPERADMIN')
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiOperation({
    summary: 'update user By Super Admin',
    description: 'دسترسی : سوپر ادمین'
  })
  @ApiBody({ type: UpdateCoachByAdminDto, description: 'آپدیت اطلاعات اصلی کاربر مثلا تایید و رد صلاحیت مربی' })
  updateCoachStatus(@Body() body: UpdateCoachByAdminDto, @Param('coachId') coachId: string) {
    return this.userService.updateCoachStatus(body, coachId)
  }

  ///  User ///
    @Get('/')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'لیست تمام کاربران', description: 'دسترسی : ادمین وسوپر ادمین' })
  @ApiOkResponse({ type: PaginatedResponse(UserEntity, 'users'), description: 'Get all user with query' })
  getUser(@Query() query: QueryUserDto) {
    return this.userService.getAllUser(query)
  }

  @Post('/')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiOperation({ summary: 'create users', description: 'دسترسی : سوپر ادمین و ادمین' })
  @ApiBody({ type: UpdateUserDto })
  createUserDto(@Body() createUserDto: UpdateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  @Delete('/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('SUPERADMIN')
  @ApiParam({ name: 'id', description: 'شناسه کاربر که باید حذف شود', example: 'cf91f6d4-ba85-4dd4-b870-37dbf1702ca4' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiOperation({ summary: 'delete user with ID by  Super Admin', description: 'دسترسی : سوپر ادمین' })
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id)
  }

  @Put('/')
  @UseGuards(AccessTokenGuard)
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiOperation({
    summary: 'update user',
    description: 'دسترسی : تمام نقش های احراز هویت شده'
  })
  @ApiBody({ type: UpdateUserDto, description: 'آپدیت اطلاعات اصلی کاربر' })
  updateUser(@Body() body: UpdateUserDto, @CurrentUser('id') id: string) {
    return this.userService.updateUser(body, id)
  }

  @Put('/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('SUPERADMIN')
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiOperation({
    summary: 'Update All Users by Super Admin',
    description: 'دسترسی : سوپر ادمین'
  })
  @ApiBody({ type: UpdateUserDto })
  updateUserAdmin(@Body() body: UpdateUserDto, @Param('id') id: string) {
    return this.userService.updateUserAdmin(body, id)
  }
}