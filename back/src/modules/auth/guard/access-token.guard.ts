// src/modules/auth/guards/access-token.guard.ts
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { PrismaService } from '../../../prisma/prisma.service.js';
import {
  baseCookieOptions,
  hashToken,
  type JwtPayload,
} from '../../../common/utils/token.utils.js';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
/**
 * `req.user` حالا فقط { id, role } داره (همون چیزی که داخل JWT هست).
 * اگه جایی از req.user.email یا req.user.name استفاده کردی، اون رو از دیتابیس بخون.
 */
declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

const NOT_LOGGED_IN = 'لطفا وارد حساب کاربری خود شوید';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const cookies = (request.cookies ?? {}) as Record<string, string | undefined>;
    const accessToken = cookies[this.configService.getOrThrow<string>('jwt.accessCookieName')];
    const refreshToken = cookies[this.configService.getOrThrow<string>('jwt.refreshCookieName')];

    // ۱) access token معتبره
    const payload = accessToken ? await this.verifyAccessToken(accessToken) : null;
    if (payload) {
      request.user = payload;
      return this.checkRoles(payload, context);
    }

    // ۲) access token نیست یا منقضی شده ← با refresh token یکی تازه می‌گیریم
    if (!refreshToken) {
      throw new UnauthorizedException(NOT_LOGGED_IN);
    }

    const user = await this.validateRefreshToken(refreshToken);
    const newPayload: JwtPayload = { id: user.id, role: user.role };
    this.issueAccessToken(newPayload, response);

    request.user = newPayload;
    return this.checkRoles(newPayload, context);
  }

  /** هر خطایی (منقضی، دستکاری‌شده، ...) یعنی «معتبر نیست»؛ هیچ‌وقت خطای خام بالا نمی‌ره */
  private async verifyAccessToken(token: string): Promise<JwtPayload | null> {
    try {
      const decoded = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.configService.getOrThrow<string>('jwt.secret'),
      });
      return decoded?.id && decoded?.role ? { id: decoded.id, role: decoded.role } : null;
    } catch {
      return null;
    }
  }

  private async validateRefreshToken(refreshToken: string) {
    const record = await this.prisma.token.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      select: {
        id: true,
        expiredDate: true,
        User: { select: { id: true, role: true, status: true } },
      },
    });

    if (!record) {
      throw new UnauthorizedException(NOT_LOGGED_IN);
    }

    if (record.expiredDate.getTime() <= Date.now()) {
      await this.prisma.token.deleteMany({ where: { id: record.id } });
      throw new UnauthorizedException(NOT_LOGGED_IN);
    }

    if (record.User.status !== 'ACTIVE') {
      throw new ForbiddenException('حساب کاربری شما غیرفعال است');
    }

    return record.User;
  }

  private issueAccessToken(payload: JwtPayload, response: Response): void {
    const accessTtlMs = this.configService.getOrThrow<number>('jwt.accessTtlMs');
    const token = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.secret'),
      expiresIn: Math.floor(accessTtlMs / 1000),
    });

    response.cookie(this.configService.getOrThrow<string>('jwt.accessCookieName'), token, {
      ...baseCookieOptions(this.isProd),
      maxAge: accessTtlMs,
    });
  }

  private get isProd(): boolean {
    return this.configService.get<string>('nodeEnv') === 'production';
  }

  private checkRoles(user: JwtPayload, context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // مسیر بدون @Roles ← فقط لاگین بودن کافیه
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // سوپرادمین به همه‌ی مسیرهای نقش‌دار دسترسی داره
    if (user.role === 'SUPERADMIN') {
      return true;
    }

    // اینجا fail-closed هست: نقش نبود یا توی لیست نبود ← ممنوع
    if (!user.role || !requiredRoles.includes(user.role)) {
      throw new ForbiddenException('مجوز لازم را ندارید');
    }

    return true;
  }
}
