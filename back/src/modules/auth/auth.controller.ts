import { Body, Controller, Post, Req, Res, Delete } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ApiBody, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import { SetCookie } from './provider/set.cookie.js';
import { AuthService } from './auth.service.js';
import { AuthEntities } from './entities/auth.entities.js';
import { LoginDto } from './dto/auth.dto.js';
;

/** * کنترلر برای ورود و ثبت نام تمام کاربران سایت */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService, private readonly setCookie: SetCookie) { }

  /**
 * با درخواست کوکی های کاربر حذف خواهد شد
 * @param body نیازی به ارسال اطلاعات نیست
 * @param res شیء پاسخ برای ست‌کردن کوکی
 * @param req شیء درخواست برای خواندن اطلاعات مرورگر
 * @returns اطلاعات احراز هویت کاربر ثبت‌نام شد
 */
  @ApiOperation({ summary: 'Log-Out User' })
  @Delete('/')
  async authLogOut(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {
    return this.authService.logOut(res, req);
  }
  
  /**
   * ورود کاربر با استفاده از رمز عبور یا گوگل آیدی.
   * این متد برای ورود همه‌ی نقش‌ها (ادمین، کاربر، مهمان و ...) قابل استفاده است.
   * باید حداقل یکی از فیلدهای `password` یا `googleId` در بدنه‌ی درخواست ارسال شود.
   * پاسخ شامل اطلاعات احراز هویت (توکن‌ها و مشخصات کاربر) است که در کوکی ذخیره می‌شود.
   * @param body اطلاعات ورود شامل ایمیل و رمز یا گوگل‌آیدی
   * @param res شیء پاسخ برای ست‌کردن کوکی‌ها
   * @param req شیء درخواست برای خواندن اطلاعات مرورگر (در صورت نیاز)
   * @returns اطلاعات احراز هویت شامل دسترسی‌ها و توکن‌ها
   */
  @Post('login')
  @ApiOperation({ summary: 'Sign-In User' })
  @ApiOkResponse({ type: AuthEntities, description: 'Success' })
  @ApiBody({
    type: LoginDto,
    description:
      'Send either "password" or "googleId". One of these fields is required for login.',
  })
  async authLogin(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {    
    const information = await this.authService.login(body);
    return this.setCookie.setData(information, res, req);
  }

  /**
   * ثبت‌نام کاربر جدید با رمز عبور یا گوگل آیدی.
   * این متد حساب کاربری جدیدی می‌سازد و اطلاعات ورود را برمی‌گرداند.
   * مشابه متد ورود، ارسال یکی از فیلدهای `password` یا `googleId` الزامی است.
   * پس از ثبت‌نام موفق، توکن‌ها در کوکی ذخیره می‌شوند.
   * @param body اطلاعات ثبت‌نام شامل ایمیل، رمز عبور یا گوگل‌آیدی
   * @param res شیء پاسخ برای ست‌کردن کوکی
   * @param req شیء درخواست برای خواندن اطلاعات مرورگر
   * @returns اطلاعات احراز هویت کاربر ثبت‌نام شد
   */
  @Post('register')
  @ApiOperation({ summary: 'Sign-Up User' })
  @ApiOkResponse({ type: AuthEntities, description: 'Success' })
  @ApiBody({
    type: LoginDto,
    description:
      'Send either "password" or "googleId". One of these fields is required for registration.',
  })
  async authRegister(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {
    const information = await this.authService.register(body);
    return this.setCookie.setData(information, res, req);
  }
}
