import { Module } from '@nestjs/common';
import { ShippingService } from './shipping.service.js';
import { ShippingController } from './shipping.controller.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    imports: [AuthModule],
    controllers: [ShippingController],
    providers: [ShippingService, PrismaService],
    exports: [ShippingService],
})
export class ShippingModule { }