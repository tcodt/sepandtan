import { Module } from '@nestjs/common';
import { DietController } from './diet.controller.js';
import { DietService } from './diet.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [DietController],
  providers: [DietService],
  exports: [DietService],
})
export class DietModule { }