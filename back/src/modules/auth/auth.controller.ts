// src/modules/auth/auth.controller.ts
import { Body, Controller, Delete, HttpCode, HttpStatus, Post, Req, Res } from '@nestjs/common';
import { ApiCreatedResponse, ApiOkResponse, ApiOperation } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';
import { AuthEntities } from './entities/auth.entities.js';
import { SetCookie } from './provider/set.cookie.js';

/** ورود، ثبت‌نام و خروج کاربران */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly setCookie: SetCookie,
  ) {}

  /** خروج از همین دستگاه: refresh token این دستگاه حذف و کوکی‌ها پاک می‌شن */
  @Delete('/')
  @ApiOperation({ summary: 'Log-Out User' })
  async authLogOut(@Res({ passthrough: true }) res: Response, @Req() req: Request) {
    return this.authService.logOut(res, req);
  }

  /**
   * ورود با ایمیل و رمز، یا با googleIdToken (توکنی که گوگل به فرانت می‌ده).
   * پس از ورود موفق، توکن‌ها داخل کوکی httpOnly ذخیره می‌شن.
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sign-In User' })
  @ApiOkResponse({ type: AuthEntities, description: 'Success' })
  async authLogin(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const information = await this.authService.login(body);
    return this.setCookie.setData(information, res, req);
  }

  /**
   * ثبت‌نام با (نام، ایمیل، رمز) یا با googleIdToken.
   * نقش کاربر جدید همیشه USER است.
   */
  @Post('register')
  @ApiOperation({ summary: 'Sign-Up User' })
  @ApiCreatedResponse({ type: AuthEntities, description: 'Success' })
  async authRegister(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const information = await this.authService.register(body);
    return this.setCookie.setData(information, res, req);
  }
}
