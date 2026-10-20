import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import configServices from './config.service.js';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configServices],
      expandVariables: true
    }),
  ],
})
export class ConfigModules { }
