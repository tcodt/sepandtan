/**
 * VariantsModule - ماژول مدیریت محصولات
 */
import { Module } from '@nestjs/common';
import { VariantsController } from './variants.controller.js';
import { VariantsService } from './variants.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [VariantsController],
  providers: [VariantsService],
  exports: [VariantsService],
})
export class VariantsModule { }