import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam, ApiOkResponse } from '@nestjs/swagger';
import { BankAccountService } from './bank_account.service.js';
import { CreateBankAccountDto } from './dto/bank.dts.js';
import { AccessTokenGuard } from '../auth/guard/access-token.guard.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { BankAccountEntity } from './entities/bank.entity.js';

@UseGuards(AccessTokenGuard)
@ApiBearerAuth()
@ApiTags('Bank Accounts')
@Controller('bank-accounts')
export class BankAccountController {
    constructor(private readonly bankAccountService: BankAccountService) { }

    /**
     * دریافت لیست حساب‌های بانکی کاربر جاری (فروشنده)
     */
    @Get()
    @Roles('STORE', 'ADMIN', 'SUPERADMIN')
    @ApiOkResponse({ type: BankAccountEntity })
    @ApiOperation({ summary: 'دریافت حساب‌های بانکی من (Admin,Store,Coach)', description: 'همیشه حساب پیشفرض  یا دیفالت رو اول و خوب به کاربر نمایش بده دقت داشته باشی که ادمین مجاز به دیدن حساب های بانکی هیچکس نیست و حتی نمیتونه ویرایش و ثبت بکنه' })
    async findMyBankAccounts(@CurrentUser('id') userId: string) {
        return this.bankAccountService.findByUser(userId);
    }

    /**
     * ایجاد حساب بانکی جدید برای کاربر جاری
     */
    @Roles('STORE', 'ADMIN', 'SUPERADMIN')
    @Post()
    @ApiOperation({ summary: 'ایجاد حساب بانکی جدید (Admin,Store,Coach)', description: 'بیشتر از سه تا نمیشه حساب بانکی ساخت' })
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
    @ApiOperation({ summary: 'ویرایش حساب بانکی (Admin,Store,Coach)', description: 'تمام اطلاعات حساب بانکی قابل ویرایش و ادمین نمیتونه حساب کس دیگه ای رو تغییر بده و فقط خود شخص میتونه حسابشو تغییر بده و ایجاد کنه' })
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
    @Delete(':id')
    @Roles('STORE', 'ADMIN', 'SUPERADMIN', 'COACH')
    @ApiOperation({ summary: 'حذف حساب بانکی (Admin,Store,Coach)', description: 'سعی کن موقع حذف حساب پیشفرض بهش اخطار بدی چون فقط ادمین میتونه برای واریزی وجه حساب پیشفرض رو ببینه' })
    @ApiParam({ name: 'id', description: 'شناسه حساب بانکی' })
    async delete(
        @CurrentUser('id') userId: string,
        @Param('id') id: string,
    ) {
        return this.bankAccountService.delete(userId, id);
    }
}