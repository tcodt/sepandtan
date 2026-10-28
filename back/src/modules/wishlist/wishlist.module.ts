/**
 * WishlistModule - ماژول علاقه‌مندی‌ها
 */
import { Module } from '@nestjs/common';
import { WishlistController } from './wishlist.controller.js';
import { WishlistService } from './wishlist.service.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({     imports: [AuthModule],controllers: [WishlistController], providers: [WishlistService], exports: [WishlistService] })
export class WishlistModule {}