// src/modules/auth/auth.service.ts
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'node:crypto';
import type { Request, Response } from 'express';
import type { RolePerson } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { comparePassword, hashPassword } from '../../common/utils/hash.util.js';
import { AuthEntities } from './entities/auth.entities.js';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';
import { baseCookieOptions, hashToken } from '../../common/utils/token.utils.js';

// یک پیام برای هر دو حالت «کاربر نیست» و «رمز غلطه» (جلوگیری از لو رفتن وجود حساب)
const INVALID_CREDENTIALS = 'ایمیل یا رمز عبور اشتباه است';
const INACTIVE_ACCOUNT = 'حساب کاربری شما غیرفعال است';

interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
}

@Injectable()
export class AuthService {
  private readonly googleClient = new OAuth2Client();
  private dummyHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  // ───────────────────────── ثبت‌نام ─────────────────────────

  async register(body: RegisterDto): Promise<AuthEntities> {
    const firstUser = await this.prisma.user.findFirst({ select: { id: true } })
    const google = body.googleIdToken ? await this.verifyGoogleToken(body.googleIdToken) : null;

    const email = google?.email ?? this.normalizeEmail(body.email);
    const name = body.name?.trim() || google?.name;

    if (!email || !name) {
      throw new BadRequestException('نام و ایمیل الزامی است');
    }
    if (!google && !body.password) {
      throw new BadRequestException('رمز عبور الزامی است');
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          role: firstUser ? 'USER' : 'SUPERADMIN',
          email,
          name,
          phone: body.phone ?? null,
          googleId: google?.googleId ?? null,
          isEmailVerified: Boolean(google), // ایمیلِ تاییدشده‌ی گوگل
          password: !google && body.password ? await hashPassword(body.password) : null,
        },
      });
      return this.toAuthEntity(user);
    } catch (error) {
      // جلوگیری از race: دو ثبت‌نام همزمان با یک ایمیل/موبایل/حساب گوگل
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('این ایمیل، شماره موبایل یا حساب گوگل قبلا ثبت شده است.');
      }
      throw error;
    }
  }

  // ───────────────────────── ورود ─────────────────────────

  async login(body: LoginDto): Promise<AuthEntities> {
    const user = body.googleIdToken
      ? await this.findGoogleUser(body.googleIdToken)
      : await this.findPasswordUser(body);

    // بعد از احراز هویت چک می‌کنیم تا وضعیت حساب برای غریبه‌ها لو نره
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(INACTIVE_ACCOUNT);
    }

    return this.toAuthEntity(user);
  }

  private async findPasswordUser(body: LoginDto) {
    const email = this.normalizeEmail(body.email);
    const user = email ? await this.prisma.user.findUnique({ where: { email } }) : null;

    if (!user) {
      throw new UnauthorizedException('این حساب ثبت‌ نام نکرده است. ابتدا ثبت‌ نام کنید.');
    }
    // حتی اگه کاربر نبود یک مقایسه‌ی بی‌نتیجه انجام می‌دیم تا زمان پاسخ فرقی نکنه
    const isValid = await comparePassword(
      body.password ?? '',
      user?.password ?? (await this.getDummyHash()),
    );

    if (!user || !user.password || !isValid) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    return user;
  }

  private async findGoogleUser(idToken: string) {
    const google = await this.verifyGoogleToken(idToken);
    const user = await this.prisma.user.findUnique({ where: { googleId: google.googleId } });

    if (!user) {
      throw new UnauthorizedException('این حساب گوگل ثبت‌نام نکرده است. ابتدا ثبت‌نام کنید.');
    }
    return user;
  }

  /** ID token گوگل رو سمت سرور تایید می‌کنه (امضا، audience و انقضا) */
  private async verifyGoogleToken(idToken: string): Promise<GoogleProfile> {
    const audience = this.configService.get<string>('google.clientId');
    if (!audience) {
      throw new UnauthorizedException('ورود با گوگل فعال نیست');
    }

    try {
      const ticket = await this.googleClient.verifyIdToken({ idToken, audience });
      const payload = ticket.getPayload();

      if (!payload?.sub || !payload.email || !payload.email_verified) {
        throw new Error('invalid google payload');
      }

      return {
        googleId: payload.sub,
        email: payload.email.toLowerCase(),
        name: payload.name ?? payload.email,
      };
    } catch {
      throw new UnauthorizedException('ورود با گوگل معتبر نیست');
    }
  }

  // ───────────────────────── خروج ─────────────────────────

  /** فقط همین دستگاه خارج می‌شه؛ نشست دستگاه‌های دیگه سر جاشونه */
  async logOut(res: Response, req: Request): Promise<{ success: boolean }> {
    const accessName = this.configService.getOrThrow<string>('jwt.accessCookieName');
    const refreshName = this.configService.getOrThrow<string>('jwt.refreshCookieName');
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const refreshToken = cookies[refreshName];

    try {
      if (refreshToken) {
        await this.prisma.token.deleteMany({ where: { tokenHash: hashToken(refreshToken) } });
      }
    } finally {
      // حتی اگه دیتابیس خطا داد، کوکی‌ها پاک بشن؛ با همون گزینه‌هایی که ست شدن
      const options = baseCookieOptions(this.isProd);
      res.clearCookie(accessName, options);
      res.clearCookie(refreshName, options);
    }

    return { success: true };
  }

  // ───────────────────────── کمکی‌ها ─────────────────────────

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  }

  private normalizeEmail(email?: string): string | undefined {
    return email?.trim().toLowerCase() || undefined;
  }

  private getDummyHash(): Promise<string> {
    return (this.dummyHash ??= hashPassword(randomBytes(16).toString('hex')));
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      (error as { code?: string }).code === 'P2002'
    );
  }

  private get isProd(): boolean {
    return this.configService.get<string>('nodeEnv') === 'production';
  }

  private toAuthEntity(user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    googleId: string | null;
    role: RolePerson;
  }): AuthEntities {
    return {
      id: user.id,
      name: user.name,
      email: user.email ?? '',
      phone: user.phone ?? '',
      googleId: user.googleId ?? '',
      role: user.role,
    };
  }
}
