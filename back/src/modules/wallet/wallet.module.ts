/**
 * WalletModule - ماژول کیف پول
 */
import { Module } from '@nestjs/common';
import { WalletController } from './wallet.controller.js';
import { WalletService } from './wallet.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    imports: [AuthModule], controllers: [WalletController], providers: [WalletService], exports: [WalletService]
})
export class WalletModule { }
