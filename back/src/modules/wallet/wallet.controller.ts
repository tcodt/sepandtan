import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, BadRequestException, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiOkResponse, ApiBody } from '@nestjs/swagger';
import { WalletService } from './wallet.service.js';

import { WalletSearchDto, WalletTransactionSearchDto, WithdrawDto } from './dto/wallet.dto.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { RolePerson } from '../../generated/prisma/enums.js';
import { DetailWalletEntity, WalletEntity } from './entities/wallet.entity.js';

@ApiTags('Wallet')
@Controller('wallet')
@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @Get('my')
  @ApiOperation({ summary: 'کیف پول من' ,description:`
    * balance حساب مالی اصلی که چقدر توش پول هستش و میتونه برداشت کنه
    * pendingBalance موجودی در انتظار تایید تا واریز بشه به حساب یعنی این که کاربر یه محصولی رو خرید کرده و تا زمانی که دوره مرجوع شدن کالا تموم نشده این پول به حساب نمیشینه
    * withdrawBalance موجودی که فروشنده یا مربی درخواست کرده که برداشت بکنه
    * frozenBalance مبلغی که مسدود شده حالا میتونه برای مرجوعی کالا باشه یا هر چیزی
    * isPlatform این یعنی حساب پلتفرم و بعدا قراره تغییر بکنه
    `})
  @ApiOkResponse({ type: WalletEntity })
  async getMyWallet(@CurrentUser('id') userId: string, @CurrentUser('role') role: RolePerson) {
    return this.walletService.getMyWallet(userId, role);
  }

  @Get('profile/:id')
  @Roles('SUPERADMIN')
  @ApiOperation({ summary: 'دریافت کیف پول کاربر با آیدی' })
  @ApiOkResponse({ type: DetailWalletEntity })
  async getWallet(@Param('id') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Post('my')
  @ApiOperation({ summary: 'ساخت کیف پول', description: 'درخواست کیف پول من میزنی اگر بود که هیچی نبود یه دکمه بزار که کاربر کیف پول برای خودش بسازه یا اینکه خودکار خودت درخواست رو بزن به صورت پیشفرض من خودم میسازم ولی برای اطمینان هستش' })
  async createMyWallet(@CurrentUser('id') userId: string, @CurrentUser('role') role: RolePerson) {
    return this.walletService.createMyWallet(userId, role);
  }

  @Post('withdraw')
  @ApiOperation({ summary: 'درخواست برداشت از کیف پول' })
  async requestWithdrawal(@CurrentUser('id') userId: string, @Body() amount: WithdrawDto) {
    if (!amount) throw new BadRequestException('مبلغ برداشت الزامی است');
    return this.walletService.requestWithdrawal(userId, amount);
  }

  @Get('my/transactions/:id')
  @ApiOperation({ summary: 'لیست تراکنش‌های کاربر' })
  async getMyTransactions(@Param('id') userId: string, @Query() query: WalletTransactionSearchDto) {
    return this.walletService.getMyTransaction(userId, query);
  }

  @Get('admin/all')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'تمام کیف پول‌ها (ادمین)' })
  async getAdminWallets(@Query() query: WalletSearchDto) {
    return this.walletService.getAdminWallet(query);
  }

  @Get('admin/transactions')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'تمام تراکنش‌ها (ادمین)' })
  async getAdminTransactions(@Query() query: WalletTransactionSearchDto) {
    return this.walletService.getAdminTransaction(query);
  }

  @Put('admin/withdraw/:id/approve')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'تأیید درخواست برداشت (ادمین)' })
  async approveWithdrawal(@Param('id') id: string, @Body('description') description?: string) {
    return this.walletService.approveWithdrawal(id, description);
  }

  @Put('admin/withdraw/:id/reject')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'رد درخواست برداشت (ادمین)' })
  async rejectWithdrawal(@Param('id') id: string, @Body('description') description?: string) {
    return this.walletService.rejectWithdrawal(id, description);
  }

  @Put('admin/transactions/:id/complete')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'تکمیل تراکنش (ادمین)' })
  async completeTransaction(@Param('id') id: string, @Body('description') description?: string) {
    return this.walletService.completeTransaction(id, description);
  }

  @Put('admin/transactions/:id/fail')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'شکست تراکنش (ادمین)' })
  async failTransaction(@Param('id') id: string, @Body('description') description?: string) {
    return this.walletService.failTransaction(id, description);
  }

  @Delete('admin/transactions/:id')
  @Roles('ADMIN', 'SUPERADMIN')
  @ApiOperation({ summary: 'حذف تراکنش (ادمین)' })
  async deleteTransaction(@Param('id') id: string) {
    return this.walletService.deleteTransaction(id);
  }
}