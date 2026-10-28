/**
 * TicketsController - کنترلر مدیریت تیکت‌ها
 */
import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, BadRequestException, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { TicketService } from './ticket.service.js';
import { CreateTicketDto, QueryTicketsDto, UpdateTicketDto } from './dto/create-ticket.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';

@ApiTags('Tickets')
@Controller('tickets')
export class TicketController {
  constructor(private readonly ticketService: TicketService) { }

  /**
   * ایجاد تیکت جدید
   */
  @UseGuards(AccessTokenGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ایجاد تیکت جدید' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateTicketDto) {
    return this.ticketService.create(userId, dto);
  }

  /**
   * دریافت لیست تیکت‌ها برای کاربر
   */
  @UseGuards(AccessTokenGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'لیست تیکت‌های کاربر' })
  async getUserTickets(
    @CurrentUser('id') userId: string,
    @Query() query: QueryTicketsDto,
  ) {
    return this.ticketService.getUserTickets(userId, query);
  }

  /**
   * دریافت تیکت با شناسه
   */
  @UseGuards(AccessTokenGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'جزئیات تیکت' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.ticketService.findOne(id, userId, role);
  }

  /**
   * Update تیکت
   */
  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'ویرایش تیکت' })
  async update(@Param('id') id: string, @Body() dto: UpdateTicketDto, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.ticketService.update(id, dto, userId, role);
  }

  /**
   * Mark تیکت به عنوان خوانده شده
   */
  @UseGuards(AccessTokenGuard)
  @Patch(':id/read')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'برچسب‌گذاری تیکت به عنوان خوانده شده' })
  async markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ticketService.markAsRead(id, userId);
  }

  /**
   * ایجاد پیام جدید در تیکت
   */
  @UseGuards(AccessTokenGuard)
  @Post('/:id/messages')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'افزودن پیام به تیکت' })
  async createMessage(
    @Param('id') ticketId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTicketMessageDto,
    @CurrentUser('role') role: string,
  ) {
    return this.ticketService.createMessage(ticketId, dto, userId, role);
  }

  /**
   * GetAll تیکت‌ها (ادمین/فروشنده - admin view)
   */
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get('admin/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'تمام تیکت‌ها (ادمین)' })
  async getAllTickets(
    @CurrentUser('id') userId: string,
    @Query() query: QueryTicketsDto,
  ) {
    return this.ticketService.getAllTickets(userId, query);
  }

  /**
   * آمار تیکت‌ها برای ادمین
   */
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Get('admin/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'آمار تیکت‌ها (ادمین)' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.ticketService.getStats();
  }

  /**
 * آمار تیکت‌ها برای ادمین
 */
  @UseGuards(AccessTokenGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'حذف تیکت‌ها (ادمین)' })
  async deleteTicket(@Param('id') id: string) {
    return this.ticketService.deleteTicket(id);
  }
}