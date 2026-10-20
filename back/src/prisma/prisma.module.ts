// import { Global, Module } from '@nestjs/common';
// import { PrismaService } from './prisma.service';

// @Global()
// @Module({
//   providers: [PrismaService],
//   exports: [PrismaService],
// })
// export class PrismaModule {}

import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * ماژول Prisma برای مدیریت اتصال به دیتابیس
 * این ماژول به صورت Global تعریف شده تا در سراسر اپلیکیشن قابل استفاده باشد
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}