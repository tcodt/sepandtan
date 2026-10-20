import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, ForbiddenException, HttpException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request, Response } from "express";
import { ConfigService } from '@nestjs/config';
import { Reflector } from "@nestjs/core";
import { AuthEntities } from "../entities/auth.entities.js";
import { RolePerson } from "../../../generated/prisma/enums.js";
import { PrismaService } from "../../../prisma/prisma.service.js";
import { ROLES_KEY } from "../decorators/roles.decorator.js";

/**
 * تعریف نوع کاربری برای اضافه کردن `user` به شیء `Request` express
 * تا در سراسر کنترلرها و سرویس‌ها با `req.user` به اطلاعات کاربر احراز هویت‌شده دسترسی داشته باشیم.
 */
declare module 'express-serve-static-core' {
    interface Request {
        user?: AuthEntities & { role?: RolePerson };
    }
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
        private readonly reflector: Reflector,
        private readonly configService: ConfigService
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest<Request>();
        const response = context.switchToHttp().getResponse<Response>();
        const cookies = request.cookies as Record<string, string>;
        const refreshToken = cookies?.refresh_token;
        const accessToken = cookies?.access_token;

        if (!refreshToken && !accessToken) {
            throw new UnauthorizedException('لطفا وارد حساب کاربری خود شوید');
        }

        const nameAccess: string = this.configService.get<string>('jwt.accessToken') || 'access_token';

        try {
            const payload = await this.jwtService.verifyAsync<AuthEntities>(accessToken, {
                secret: this.configService.get<string>('jwt.secret'),
            });
            request.user = payload;
            return this.checkRoles(payload, context);
        } catch (error) {
            // If it's a HTTP exception or no refresh token, rethrow
            if (error instanceof HttpException || !refreshToken) {
                throw error;
            }

            // Try to validate using refresh token from database
            const data = await this.prisma.token.findFirst({
                where: { tokenHash: refreshToken },
                select: {
                    User: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            role: true,
                        }
                    }
                }
            });

            if (data && data.User) {
                this.checkRoles(data.User, context);
                const jwt = this.jwtService.sign(data.User);
                request.user = data.User;

                // Issue a new access token
                response.cookie(nameAccess, jwt, {
                    httpOnly: true,
                    secure: this.configService.get<string>('NODE_ENV') === 'production',
                    sameSite: 'strict',
                    path: '/',
                    maxAge: 10 * 60 * 60 * 1000,
                });
                return true;
            } else {
                throw new UnauthorizedException('لطفا وارد حساب کاربری خود شوید');
            }
        }
    }

    private checkRoles(user: { role?: RolePerson }, context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (requiredRoles && requiredRoles.length > 0 && user?.role) {
            const userRole = user.role;
            if (!requiredRoles.includes(userRole)) {
                throw new ForbiddenException('مجوز لازم را ندارید');
            }
        }

        return true;
    }
}