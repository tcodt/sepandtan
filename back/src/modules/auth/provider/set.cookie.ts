import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import type { RolePerson } from '../../../generated/prisma/enums.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

import { AuthEntities } from '../entities/auth.entities.js';
import { baseCookieOptions, generateRefreshToken, hashToken, JwtPayload } from '../../../common/utils/token.utils.js';

@Injectable()
export class SetCookie {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * بعد از ورود/ثبت‌نام موفق صدا زده می‌شه:
   *  - access token (JWT) می‌سازه
   *  - refresh token تصادفی می‌سازه و «هشِ» اون رو با تاریخ انقضا توی دیتابیس می‌ذاره
   *  - هر دو رو داخل کوکی httpOnly می‌ذاره
   */
  async setData(user: AuthEntities, res: Response, req: Request): Promise<AuthEntities> {
    const secret = this.configService.getOrThrow<string>('jwt.secret');
    const accessName = this.configService.getOrThrow<string>('jwt.accessCookieName');
    const refreshName = this.configService.getOrThrow<string>('jwt.refreshCookieName');
    const accessTtlMs = this.configService.getOrThrow<number>('jwt.accessTtlMs');
    const refreshTtlMs = this.configService.getOrThrow<number>('jwt.refreshTtlMs');
    const isProd = this.configService.get<string>('nodeEnv') === 'production';

    const payload: JwtPayload = { id: user.id, role: user.role as RolePerson };
    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: Math.floor(accessTtlMs / 1000),
    });

    const refreshToken = generateRefreshToken();
    await this.prisma.token.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId: user.id,
        device: req.headers['user-agent']?.slice(0, 255) ?? null,
        ipAddress: req.ip ?? null,
        expiredDate: new Date(Date.now() + refreshTtlMs),
      },
    });

    const base = baseCookieOptions(isProd);
    res.cookie(accessName, accessToken, { ...base, maxAge: accessTtlMs });
    res.cookie(refreshName, refreshToken, { ...base, maxAge: refreshTtlMs });

    return user;
  }
}
