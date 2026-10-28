/**
 * ReportModule - ماژول مدیریت گزارش‌ها
 */
import { Module } from '@nestjs/common';
import { TicketService } from './ticket.service.js';
import { TicketController } from './ticket.controller.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    imports: [AuthModule],
    controllers: [TicketController],
    providers: [TicketService],
    exports: [TicketService],
})
export class TicketModule { }