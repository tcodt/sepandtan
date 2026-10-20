// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';

// @Injectable()
// export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  
//   async onModuleInit() {
//     console.log("Connect Database");
//     await this.$connect();
//   }

//   async onModuleDestroy() {
//     console.log("Disconnect Database");
//     await this.$disconnect();
//   }
// }
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * سرویس Prisma برای مدیریت اتصال به دیتابیس
 * این سرویس اتصال به دیتابیس را در هنگام بارگذاری ماژول مدیریت می‌کند
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
 constructor() {
    // ایجاد اتصال به دیتابیس از طریق pg Pool و PrismaPg adapter
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
    });
  }

  /**
   * مقداردهی اولیه سرویس هنگام بارگذاری ماژول
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * پاکسازی سرویس هنگام بسته شدن ماژول
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}