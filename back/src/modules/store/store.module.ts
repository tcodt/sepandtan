import { Module } from '@nestjs/common'
import { StoreController } from './store.controller.js'
import { StoreService } from './store.service.js'
import { PrismaService } from '../../prisma/prisma.service.js'
import { AuthModule } from '../auth/auth.module.js'

@Module({
  imports: [AuthModule],
  controllers: [StoreController],
  providers: [
    StoreService,
    PrismaService,
  ],
  exports: [
    StoreService,
  ],
})
export class StoreModule { } 