import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { AuthEntities } from '../entities/auth.entities.js';
import { hashRefreshToken } from '../../../common/utils/hash.util.js';

@Injectable()
export class SetCookie {
    constructor(
        private readonly jwtService: JwtService,
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService
    ) { }

    async setData(information: AuthEntities, res: Response, req: Request) {
        // Clean up old refresh tokens for this user before creating a new one
        await this.prisma.token.deleteMany({
            where: { userId: information.id }
        });

        const hashToken = hashRefreshToken(uuidv4());
        const ip = (req.headers['x-forwarded-for'] as string || '').split(',')[0].trim() || req.socket.remoteAddress || '';
        const nameRefresh: string = this.configService.get<string>('jwt.refreshToken') || 'refresh_token';
        const nameAccess: string = this.configService.get<string>('jwt.accessToken') || 'access_token';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const deviceInfo = `${userAgent}-${ip}`;
        const { email, id, name, role } = information;
        const jwt = this.jwtService.sign({ email, id, name, role });

        await this.prisma.token.create({
            data: {
                tokenHash: hashToken,
                userId: information.id,
                device: deviceInfo,
                ipAddress: ip
            }
        });

        const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

        res.cookie(nameRefresh, hashToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        res.cookie(nameAccess, jwt, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 10 * 60 * 60 * 1000, // 10 hours
        });

        return information;
    }
}