import { Module } from '@nestjs/common';
import { ColorsController } from './colors.controller.js';
import { ColorsService } from './colors.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [ColorsController],
  providers: [ColorsService],
  exports: [ColorsService],
})
export class ColorsModule { }