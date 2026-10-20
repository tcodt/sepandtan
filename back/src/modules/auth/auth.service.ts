import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthEntities } from './entities/auth.entities.js';
import { LoginDto } from './dto/auth.dto.js';
import { Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service.js';
import { comparePassword, hashPassword } from '../../common/utils/hash.util.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
  ) { }

  async register(body: LoginDto): Promise<AuthEntities> {
    const firstUser = await this.prisma.user.count();
    if (!await this.findByEmail(body.email)) {
      const userCreate = await this.prisma.user.create({
        data: {
          role: firstUser ? 'USER' : 'ADMIN',
          email: body.email,
          name: body.name,
          phone: body.phone,
          googleId: body?.googleId || null,
          password: body.password ? await hashPassword(body.password) : null,
        },
      });
      return {
        createdAt: userCreate.createdAt,
        googleId: userCreate.googleId || '',
        phone: userCreate.phone || '',
        role: userCreate.role,
        email: userCreate.email,
        name: userCreate.name,
        id: userCreate.id,
      };
    } else {
      throw new ConflictException('کاربر قبلا باایمیل ارسال شده ثبت نام کرده است.');
    }
  }

  async login(body: LoginDto): Promise<AuthEntities> {
    const findUser = await this.findByEmail(body.email);

    if (findUser) {
      // If user has password set, verify it
      if (body.password && findUser.password) {
        const isPasswordValid = await comparePassword(body.password, findUser.password);
        if (!isPasswordValid) {
          throw new UnauthorizedException('رمز وارد شده اشتباه است');
        }
      } else if (!body.password && findUser.googleId) {
        // Google login without password
        // User logged in with Google, no password needed
      } else {
        throw new UnauthorizedException('ایمیل یا رمز عبور اشتباه است');
      }

      return {
        createdAt: findUser.createdAt,
        googleId: findUser?.googleId || '',
        phone: findUser.phone || '',
        role: findUser.role,
        email: findUser.email,
        name: findUser.name,
        id: findUser.id,
      };
    } else {
      throw new ConflictException('کاربری با این ایمیل ثبت نام نکرده است.');
    }
  }

  async logOut(res: Response, req: Request) {
    const cookies = req.cookies as Record<string, string>;

    // Clean up refresh tokens from database
    if (cookies?.refresh_token) {
      try {
        // Find and delete the token from database
        const token = await this.prisma.token.findFirst({
          where: { tokenHash: cookies.refresh_token },
          select: { userId: true }
        });
        if (token?.userId) {
          await this.prisma.token.deleteMany({
            where: { userId: token.userId }
          });
        }
      } catch (_err) {
        // Ignore errors during cleanup
      }
    }

    if (!cookies?.access_token && !cookies?.refresh_token) {
      return { success: true };
    }
    try {
      res.clearCookie('access_token');
      res.clearCookie('refresh_token');
      return { success: true };
    } catch (err) {
      throw new ConflictException('دوباره تلاش کنید.');
    }
  }

  async findByEmail(email: string) {
    try {
      return await this.prisma.user.findUnique({ where: { email } });
    } catch (_err) {
      return null;
    }
  }
}