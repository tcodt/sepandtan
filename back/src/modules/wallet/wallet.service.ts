/**
 * WalletService - سرویس کیف پول
 */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { WalletSearchDto, WalletTransactionSearchDto } from './dto/wallet.dto.js';
import { Prisma, RolePerson, WalletTransactionStatus, WalletTransactionType } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import pagination from '../../common/utils/pagination.js';

const PREFIX_MAP: Record<string, string> = {
  deposit: 'DEP',
  withdraw: 'WTH',
  commission: 'COM',
  tax: 'TAX',
  refund: 'RFD',
  purchase: 'PRC',
  sale_settlement: 'STL',
  return_deduction: 'RTD',
};

type WalletAmount = Prisma.Decimal | string | number;

type CreateWalletTransactionInput = {
  type: WalletTransactionType;
  amount: WalletAmount;
  userId: string;
  orderId?: string;
  returnRequestId?: string;
  SettlementDate?: Date;
  description?: string;
};

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) { }

  private generateTrackingCode(type: WalletTransactionType): string {
    const prefix = PREFIX_MAP[type] || 'TX';
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${prefix}-${date}-${random}`;
  }

  private async getPlatformWallet() {
    const wallet = await this.prisma.wallet.findFirst({ where: { isPlatform: true } });
    if (!wallet) { throw new BadRequestException('کیف پول پلتفرم یافت نشد'); }
    return wallet;
  }

  async completeTransaction(id: string, description?: string) {
    return this.prisma.$transaction(async tx => {
      const transaction = await tx.walletTransaction.findUnique({
        where: { id },
        include: {
          wallet: true,
        },
      });

      if (!transaction) {
        throw new NotFoundException('تراکنش یافت نشد');
      }

      if (transaction.status !== WalletTransactionStatus.PENDING) {
        throw new BadRequestException('این تراکنش قبلاً تعیین تکلیف شده است');
      }

      const amount = new Prisma.Decimal(transaction.amount);
      const platform = await this.getPlatformWallet();

      if (transaction.type === WalletTransactionType.PURCHASE) {
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            pendingBalance: { decrement: amount },
            balance: { increment: amount },
          },
        });
        await tx.wallet.update({
          where: { id: platform.id },
          data: {
            balance: { increment: amount },
          },
        });
      }

      if (transaction.type === WalletTransactionType.WITHDRAW) {
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            withdrawBalance: { decrement: amount },
          },
        });
      }

      if (
        transaction.type === WalletTransactionType.COMMISSION ||
        transaction.type === WalletTransactionType.TAX ||
        transaction.type === WalletTransactionType.REFUND ||
        transaction.type === WalletTransactionType.RETURN_DEDUCTION
      ) {
        /*
         * این نوع‌ها هنگام ایجاد، مبلغ از موجودی مربوطه
         * کم شده‌اند و با complete فقط status تغییر می‌کند.
         */
      }

      return tx.walletTransaction.update({
        where: { id },
        data: {
          status: WalletTransactionStatus.COMPLETED,
          description: description ?? transaction.description,
        },
      });
    });
  }
  async failTransaction(id: string, description?: string) {
    return this.prisma.$transaction(async tx => {
      const transaction = await tx.walletTransaction.findUnique({ where: { id } });
      if (!transaction) { throw new NotFoundException('تراکنش یافت نشد') }
      if (transaction.status !== WalletTransactionStatus.PENDING) { throw new BadRequestException('این تراکنش قبلاً تعیین تکلیف شده است'); }
      const amount = new Prisma.Decimal(transaction.amount);
      if (transaction.type === WalletTransactionType.PURCHASE) {
        const platform = await tx.wallet.findFirst({
          where: { isPlatform: true },
        });

        if (!platform) {
          throw new BadRequestException('کیف پول پلتفرم یافت نشد');
        }

        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            pendingBalance: { decrement: amount },
          },
        });

        await tx.wallet.update({
          where: { id: platform.id },
          data: {
            balance: { decrement: amount },
          },
        });
      }

      if (transaction.type === WalletTransactionType.WITHDRAW) {
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: { increment: amount },
            withdrawBalance: { decrement: amount },
          },
        });
      }

      return tx.walletTransaction.update({
        where: { id },
        data: {
          status: WalletTransactionStatus.FAILED,
          description: description ?? transaction.description,
        },
      });
    });
  }

  async requestWithdrawal(userId: string, amount: WalletAmount) {
    const value = new Prisma.Decimal(amount);
    if (value.lessThanOrEqualTo(0)) { throw new BadRequestException('مبلغ برداشت نامعتبر است') }
    return this.prisma.$transaction(async tx => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });
      if (!wallet || wallet.isPlatform) {
        throw new BadRequestException('کیف پول فروشنده یافت نشد');
      }
      if (wallet.withdrawBalance) {
        throw new BadRequestException('یک درخواست برداشت در حال بررسی دارید');
      }
      if (new Prisma.Decimal(wallet.balance).lessThan(value)) {
        throw new BadRequestException('موجودی قابل برداشت کافی نیست');
      }
      const transaction = await tx.walletTransaction.create({
        data: {
          amount: value,
          type: WalletTransactionType.WITHDRAW,
          status: WalletTransactionStatus.PENDING,
          trackingCode: this.generateTrackingCode(WalletTransactionType.WITHDRAW),
          userId,
          walletId: wallet.id,
        },
      });
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: value },
          withdrawBalance: { increment: value },
        },
      });
      return transaction;
    });
  }
  async approveWithdrawal(id: string, description?: string) {
    return this.prisma.$transaction(async tx => {
      const transaction = await tx.walletTransaction.findUnique({ where: { id } })
      if (!transaction) { throw new NotFoundException('تراکنش یافت نشد') }
      if (transaction.type !== WalletTransactionType.WITHDRAW) { throw new BadRequestException('این تراکنش برداشت نیست') }
      if (transaction.status !== WalletTransactionStatus.PENDING) { throw new BadRequestException('این برداشت قبلاً تعیین تکلیف شده است') }
      const amount = new Prisma.Decimal(transaction.amount);
      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: {
          withdrawBalance: { decrement: amount },
        },
      });
      return tx.walletTransaction.update({
        where: { id },
        data: {
          status: WalletTransactionStatus.COMPLETED,
          description: description ?? transaction.description,
        },
      });
    });
  }
  async rejectWithdrawal(id: string, description?: string) {
    return this.prisma.$transaction(async tx => {
      const transaction = await tx.walletTransaction.findUnique({ where: { id }, });
      if (!transaction) { throw new NotFoundException('تراکنش یافت نشد'); }
      if (transaction.type !== WalletTransactionType.WITHDRAW) { throw new BadRequestException('این تراکنش برداشت نیست'); }
      if (transaction.status !== WalletTransactionStatus.PENDING) { throw new BadRequestException('این برداشت قبلاً تعیین تکلیف شده است'); }
      const amount = new Prisma.Decimal(transaction.amount);
      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: { increment: amount },
          withdrawBalance: { decrement: amount },
        },
      });
      return tx.walletTransaction.update({
        where: { id },
        data: {
          status: WalletTransactionStatus.FAILED,
          description: description ?? transaction.description,
        },
      });
    });
  }

  async createMyWallet(userId: string, role: RolePerson) {
    await this.prisma.wallet.create({
      data: {
        userId,
        isPlatform: role === 'SUPERADMIN'
      }
    })
    return { succee: true }
  }

  async getMyWallet(userId: string) {
    return this.prisma.wallet.findUnique({ where: { userId } })
  }

  async getAdminWallet(query: WalletSearchDto) {
    const { limit, order, page = 1, userId } = query
    const limitPage = Number(limit) || Number(this.configService.get('limit.wallet'))
    const skip = (page - 1) * limitPage;
    const where = {
      ...(userId && { userId })
    }
    const [wallet, count] = await this.prisma.$transaction([
      this.prisma.wallet.findMany({
        where,
        skip,
        take: limitPage,
        orderBy: { createdAt: order || 'desc' },
        include: {
          user: { select: { lastName: true, firstName: true, username: true, phone: true, store: { select: { name: true, phone: true } } } },
          bankAccounts: {
            select: { iban: true, bankName: true, cardNumber: true, accountHolder: true }
          }
        }
      }),
      this.prisma.wallet.count({ where }),
    ]);
    return {
      wallet,
      pagination: pagination(count, Number(page), Number(limitPage)),
    };
  }

  async deleteTransaction(id: string) {
    await this.prisma.walletTransaction.delete({ where: { id } })
  }

  async getMyTransaction(userId: string, query: WalletTransactionSearchDto) {
    const { limit, order, page = 1, status, trackingCode, type } = query
    const limitPage = Number(limit) || Number(this.configService.get('limit.wallet'))
    const skip = (page - 1) * limitPage;
    const where = {
      ...(userId && { userId }),
      ...(status !== 'all' && { status }),
      ...(type !== 'all' && { type }),
      ...(trackingCode && { trackingCode })
    }
    const [transaction, count] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where,
        skip,
        take: limitPage,
        orderBy: { createdAt: order || 'desc' },
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    return {
      transaction,
      pagination: pagination(count, Number(page), Number(limitPage)),
    };
  }

  async getAdminTransaction(query: WalletTransactionSearchDto) {
    const { limit, order, page = 1, status, trackingCode, type, userId } = query
    const limitPage = Number(limit) || Number(this.configService.get('limit.wallet'))
    const skip = (page - 1) * limitPage;
    const where = {
      ...(status !== 'all' && { status }),
      ...(type !== 'all' && { type }),
      ...(userId && { userId }),
      ...(trackingCode && { trackingCode })
    }
    const [transaction, count] = await this.prisma.$transaction([
      this.prisma.walletTransaction.findMany({
        where,
        skip,
        take: limitPage,
        orderBy: { createdAt: order || 'desc' },
      }),
      this.prisma.walletTransaction.count({ where }),
    ]);
    return {
      transaction,
      pagination: pagination(count, Number(page), Number(limitPage)),
    };
  }

  async getWallet(id: string) {
    return await this.prisma.wallet.findUnique({
      where: { id },
      include: {
        bankAccounts: true,
        user: true
      }
    })
  }
}
