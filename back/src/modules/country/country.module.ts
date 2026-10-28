import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { CountriesController } from './country.controller.js';
import { CountriesService } from './country.service.js';

@Module({
  imports: [AuthModule],
  controllers: [CountriesController],
  providers: [CountriesService],
  exports: [CountriesService],
})
export class CountryModule { }