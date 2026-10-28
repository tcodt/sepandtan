// src/common/utils/token.util.ts
import { createHash, randomBytes } from 'node:crypto';
import type { CookieOptions } from 'express';
import type { RolePerson } from '../../generated/prisma/enums.js';

/** چیزی که داخل access token (JWT) گذاشته می‌شه؛ عمداً حداقلی */
export interface JwtPayload {
  id: string;
  role: RolePerson;
}

/** refresh token تصادفی ۶۴ کاراکتری؛ خودش داخل دیتابیس ذخیره نمی‌شه */
export const generateRefreshToken = (): string => randomBytes(48).toString('base64url');

/**
 * هش SHA-256 برای ذخیره‌ی refresh token.
 * چون توکن تصادفی و پرانتروپیه، نیازی به bcrypt نیست و جستجو با unique index سریع می‌مونه.
 */
export const hashToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

/** گزینه‌های مشترک کوکی؛ برای set و clear باید دقیقاً یکی باشن */
export const baseCookieOptions = (isProd: boolean): CookieOptions => ({
  httpOnly: true,
  secure: isProd,
  sameSite: 'strict',
  path: '/',
});
