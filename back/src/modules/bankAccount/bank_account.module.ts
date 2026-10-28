/**
 * BrandsModule - ماژول دسته‌بندی‌ها
 */
import { Module } from '@nestjs/common';
import { BankAccountService } from './bank_account.service.js';
import { BankAccountController } from './bank_account.controller.js';
import { AuthModule } from '../auth/auth.module.js';


@Module({
  imports: [AuthModule],
  controllers: [BankAccountController],
  providers: [BankAccountService],
  exports: [BankAccountService],
})
export class BankAccountModule { }
