import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOkResponse, ApiOperation, ApiParam } from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { UserEntity } from './entities/user.entities.js';
import type { Request } from 'express';
import { QueryUserDto } from './dtos/query.user.js';
import { UpdateUserDto } from './dtos/update.user.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { QueryDefaultDto } from '../../common/dtos/query.defualt.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

/** * کنترلر برای ساخت و اپدیت تمام کاربران سایت */
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  /**
 * دسترسی : ادمین.
 * با استفاده از کوئری ها سرچ برای افراد ثبت نام شده .
 * @param Query اطلاعات ورود شامل سرچ صفحه بندی و ...
 * @param req شیء درخواست برای احراز هویت 
 * @returns تمام کاربران و صفحه بندی ها
 */
  @Get('/')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'get all users', description: 'دسترسی : ادمین' })
  @ApiOkResponse({ type: PaginatedResponse<UserEntity>, description: 'Get all user with query' })
  getUser(@Query() query: QueryUserDto) {
    return this.userService.getAllUser(query)
  }

  /**
 * با ارسال درخواست پروفایل کاربر ارسال میشه.
 * @param req شیء درخواست برای احراز هویت
 * @returns اطلاعات کاربر
 */
  @Get('profile')
  @UseGuards(AccessTokenGuard)
  @Roles('USER', 'ADMIN', 'AOTHUR', 'Contractor')
  @ApiOperation({ summary: 'get Profile', description: 'دسترسی : تمام نقش های احراز هویت شده' })
  @ApiOkResponse({ type: UserEntity, description: 'Success' })
  async getProfile(@Req() req: Request, @Query("id") id?: string, @CurrentUser('role') rolesd?: string) {
    return this.userService.getProfile(req, id, rolesd)
  }

  /**
 * ساخت کاربر جدید توسط ادمین
 * @param body اطلاعاتی شامل ایمیل و رمز یا نام کاربر
 * @param req شیء درخواست برای احراز هویت
 * @returns پیغام تایید
 */
  @Post('/')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN')
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiOperation({ summary: 'create users', description: 'دسترسی : ادمین' })
  @ApiBody({ type: UpdateUserDto })
  PostUser(@Body() createUserDto: UpdateUserDto) {
    return this.userService.createUser(createUserDto);
  }

  /**
 * حذف کاربر توسط ادمین با استفاده از پارام
 * @param Param اطلاعاتی شامل ایدی
 * @param req شیء درخواست برای احراز هویت
 * @returns پیغام تایید
 */
  @Delete('/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN')
  @ApiParam({ name: 'id', description: 'شناسه کاربر که باید حذف شود', example: 'cf91f6d4-ba85-4dd4-b870-37dbf1702ca4' })
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiOperation({ summary: 'delete user with ID', description: 'دسترسی : ادمین' })
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id)
  }

  /**
 * کاربر میتواند اطلاعات خودش را اپدیت بکند 
 * زمانی که ایدی دریافت بشود باید احراز هویت ادمین تایید شود تا اطلاعات ایدی شخصی که ارسال شده را اپدیت کند
 * @param body اطلاعاتی شامل ایمیل و رمز یا نام کاربر یا ایدی که به صورت اختیاری هستش
 * @param req شیء درخواست برای احراز هویت
 * @returns پیغام تایید
 */
  @Put('/:id')
  @UseGuards(AccessTokenGuard)
  @Roles('USER', 'ADMIN', 'AOTHUR', 'Contractor')
  @ApiOkResponse({ schema: { example: { success: true } } })
  @ApiOperation({
    summary: 'update user',
    description: 'دسترسی : تمام نقش های احراز هویت شده'
  })
  @ApiBody({ type: UpdateUserDto, description: 'ارسال آیدی به صورت اختیاری هستش کاربر برای آپدیت پروفایل خودش نیاز به ارسال آیدی ندارد و زمانی که ادمین پروفایل شخص دیگری را آپدیت بکند نیاز به ارسال آیدی آن شخص است' })
  updateUser(@Body() body: UpdateUserDto, @Req() req: Request) {
    return this.userService.updateUser(body, req)
  }

  /**
* تمام کاربران که رول مجری را دارند ولی هنوز اطلاعاتی برای بخش مجری ها ثبت نکرده اند با استفاده از این فانکشن نمایش داده میشوند 
* @returns پیغام تایید
*/
  @Get('/getcontractor')
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN')
  @ApiOkResponse({ type: UserEntity, description: 'Success' })
  @ApiOperation({
    summary: 'get contractor',
    description: 'تمام کاربرانی که مجری هستند ولی اطلاعات بخش مجری خود را ثبت نکرده اند'
  })
  getContractor(@Query() query: QueryDefaultDto) {
    return this.userService.getUsersWithoutContractorProfile(query)
  }
}
