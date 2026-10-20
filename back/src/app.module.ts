import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module.js';
import { ConfigModules } from './common/config/config.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { UserModule } from './modules/user/user.module.js';

@Module({
  imports: [
    PrismaModule, UserModule,
    ConfigModules, AuthModule,
  ],
})
export class AppModule { }
