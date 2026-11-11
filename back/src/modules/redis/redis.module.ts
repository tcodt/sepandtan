import { Module, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

// @Global()
// @Module({
//   imports: [
//     BullModule.forRoot({
//       connection: {
//         host: 'localhost',
//         port: 6379,
//       },
//     }),
//   ],
//   exports: [BullModule],
// })
// export class RedisModule {}
// 
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: () => ({
        connection: {
          host: process.env.REDIS_HOST ?? 'localhost',
          port: Number(process.env.REDIS_PORT ?? 6379),
          password: process.env.REDIS_PASSWORD || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: { count: 10 },
          removeOnFail: { count: 50 },
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class RedisModule {}
