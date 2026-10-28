/**
 * BrandsModule - ماژول دسته‌بندی‌ها
 */
import { Module } from '@nestjs/common';
import { BrandsController } from './brand.controller.js';
import { BrandService } from './brand.service.js';
import { AuthModule } from '../auth/auth.module.js';


@Module({
  imports: [AuthModule],
  controllers: [BrandsController],
  providers: [BrandService],
  exports: [BrandService],
})
export class BrandsModule { }
