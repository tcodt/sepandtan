import { Module } from '@nestjs/common';
import { ProvinceService } from './province.service.js';
import { ProvinceController } from './province.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  exports: [ProvinceService],
  providers: [ProvinceService],
  controllers: [ProvinceController]
})
export class ProvinceModule { }
