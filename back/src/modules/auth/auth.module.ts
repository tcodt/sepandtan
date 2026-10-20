import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AccessTokenGuard } from './guard/access-token.guard.js';
import { Reflector } from '@nestjs/core';
import { SetCookie } from './provider/set.cookie.js';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, SetCookie, AccessTokenGuard, Reflector],
  exports: [JwtModule, AccessTokenGuard, Reflector],
})
export class AuthModule { }
