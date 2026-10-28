import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { BankAccountService } from './bank_account.service.js';
import { CreateBankAccountDto } from './dto/bank.dts.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
@ApiTags('Bank Accounts')
@Controller('bank-accounts')
export class BankAccountController {
    constructor(private readonly bankAccountService: BankAccountService) { }

    /**
     * دریافت لیست حساب‌های بانکی کاربر جاری (فروشنده)
     */
    @Roles('STORE', 'ADMIN', 'SUPERADMIN')
    @Get()
    @ApiOperation({ summary: 'دریافت حساب‌های بانکی من' })
    async findMyBankAccounts(@CurrentUser('id') userId: string) {
        return this.bankAccountService.findByUser(userId);
    }

    /**
     * ایجاد حساب بانکی جدید برای کاربر جاری
     */
    @Roles('STORE', 'ADMIN', 'SUPERADMIN')
    @Post()
    @ApiOperation({ summary: 'ایجاد حساب بانکی جدید' })
    async create(
        @CurrentUser('id') userId: string,
        @Body() dto: CreateBankAccountDto,
    ) {
        return this.bankAccountService.create(userId, dto);
    }

    /**
     * ویرایش حساب بانکی (فقط مالک یا ادمین)
     */
    @Roles('STORE', 'ADMIN', 'SUPERADMIN')
    @Put(':id')
    @ApiOperation({ summary: 'ویرایش حساب بانکی' })
    @ApiParam({ name: 'id', description: 'شناسه حساب بانکی' })
    async update(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
        @Body() dto: CreateBankAccountDto,
    ) {
        return this.bankAccountService.update(userId, id, dto);
    }

    /**
     * حذف حساب بانکی (فقط مالک یا ادمین)
     */
    @Roles('STORE', 'ADMIN', 'SUPERADMIN')
    @Delete(':id')
    @ApiOperation({ summary: 'حذف حساب بانکی' })
    @ApiParam({ name: 'id', description: 'شناسه حساب بانکی' })
    async delete(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
    ) {
        return this.bankAccountService.delete(userId, id);
    }
}