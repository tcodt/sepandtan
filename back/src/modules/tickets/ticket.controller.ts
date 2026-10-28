/**
 * TicketsController - کنترلر مدیریت تیکت‌ها
 */
import { Controller, Get, Post, Put, Patch, Body, Param, Query, UseGuards, BadRequestException, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { CreateTicketMessageDto } from './dto/create-ticket-message.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { TicketService } from './ticket.service.js';
import { CreateTicketDto, QueryTicketsDto, UpdateTicketDto } from './dto/create-ticket.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { PaginatedResponse } from '../../common/dtos/pagination-response.dto.js';
import { AdminTicketListResponseEntity, TicketDetailEntity, TicketEntity } from './entities/ticket.entity.js';

@ApiTags('Tickets')
@Controller('tickets')
@UseGuards(AccessTokenGuard)
export class TicketController {
  constructor(private readonly ticketService: TicketService) { }

  @Post()
  @ApiOperation({
    summary: 'ایجاد تیکت جدید (User)', description: `
    * ارسال ایدی تسویه سفارش اختیاری هستش 
    * LOW اولویت کم
    * MEDIUM اولویت متوسط
    * HIGH اولویت بالا
    * URGENT اولویت فوری
    * CRITICAL اولویت اضطراری
    ` })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateTicketDto) {
    return this.ticketService.create(userId, dto);
  }

  /**
   * دریافت لیست تیکت‌ها برای کاربر
   */
  @Get()
  @ApiOperation({ summary: 'لیست تیکت‌های من (User)', description: 'این بخش برای کاربر هستش که تیکت هایی که ثبت کرده رو میتونه ببینه ' })
  @ApiOkResponse({ type: PaginatedResponse(TicketEntity, 'tickets') })
  async getUserTickets(@CurrentUser('id') userId: string, @Query() query: QueryTicketsDto,) {
    return this.ticketService.getUserTickets(userId, query);
  }

  /**
   * دریافت تیکت با شناسه
   */
  @Get(':id')
  @ApiOkResponse({ type: TicketDetailEntity })
  @ApiOperation({ summary: 'جزئیات تیکت (User & Admin)', description: 'یه هدر برای تیکت پشتیبانی درست شده و بقیه متن ها داخل تیکت مسیج قرار داره که باید نمایش بدی شبیه به محیط پیامرسان ها یا تلگرام' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.ticketService.findOne(id, userId, role);
  }

  /**
   * Update تیکت
   */
  @Patch(':id')
  @ApiOperation({ summary: 'ویرایش تیکت (Admin)', description: 'این بخش برای زمانی هستش که تیکت رو ادمین ببنده یا تغییر وضعیت بده' })
  async update(@Param('id') id: string, @Body() dto: UpdateTicketDto, @CurrentUser('id') userId: string, @CurrentUser('role') role: string) {
    return this.ticketService.update(id, dto, userId, role);
  }

  /**
   * Mark تیکت به عنوان خوانده شده
   */
  @Patch(':id/read')
  @ApiOperation({ summary: 'برچسب گزاری به عنوان خوانده شده توسط کاربر (User)', description: 'وقتی که کاربر صفحه تیکت رو باز میکنه و به پایین میره و تمام متن هاشو به اصطلاح خونده اون وقت این رو میفرستی که ادمین متوجه میشه کاربر این تیکت رو خونده ' })
  async markAsRead(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.ticketService.markAsRead(id, userId);
  }

  /**
   * ایجاد پیام جدید در تیکت
   */
  @Post('/:id/messages')
  @ApiOperation({ summary: 'افزودن پیام به تیکت (Admin User)', description: 'کاربر و هم ادمین میتونه از این بخش استفاده بکنه' })
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
  @Get('admin/all')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOkResponse({ type: PaginatedResponse(AdminTicketListResponseEntity, 'tickets') })
  @ApiOperation({ summary: 'تمام تیکت‌ها (Admin)', description: 'این بخش برای ادمین هستش و فروشنده یا کس دیگه ای اجازه دسترسی نداره' })
  async getAllTickets(@CurrentUser('id') userId: string, @Query() query: QueryTicketsDto) {
    return this.ticketService.getAllTickets(userId, query);
  }

  /**
   * آمار تیکت‌ها برای ادمین
   */
  @Get('admin/stats')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'آمار تیکت‌ها (Admin)', description: 'یه اطلاعات کلی در رابطه با تیکت هایی که مونده ادمین به دست میاره' })
  async getStats(@CurrentUser('id') userId: string) {
    return this.ticketService.getStats();
  }

  /**
 * آمار تیکت‌ها برای ادمین
 */
  @Roles('ADMIN', 'SUPERADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'حذف تیکت‌ها (Admin)', description: '' })
  async deleteTicket(@Param('id') id: string) {
    return this.ticketService.deleteTicket(id);
  }
}