import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateBankAccountDto } from './dto/bank.dts.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class BankAccountService {
    constructor(private readonly prisma: PrismaService) { }
    async findByUser(userId: string) {
        return await this.prisma.bankAccount.findMany({ where: {}, orderBy: { createdAt: 'desc' } })
    }
    async create(userId: string, dto: CreateBankAccountDto) {
        const count = await this.prisma.bankAccount.count({ where: { userId } })
        const wallet = await this.prisma.wallet.findUnique({ where: { userId:userId } })
        if (count >= 3) {
            throw new ConflictException('حداکثر ۳ حساب بانکی مجاز است.');
        }
         if (!wallet?.id) {
            throw new ConflictException('لطفا اول کیف پول برای خود بسازید سپس حساب بانکی بسازید.');
        }
        const data = await this.prisma.bankAccount.create({ data: { ...dto, userId } })
        if (dto.isDefault) {
            await this.prisma.$transaction([
                this.prisma.bankAccount.updateMany({
                    where: {
                        userId,
                        id: { not: data.id },
                        isDefault: true,
                    },
                    data: { isDefault: false },
                }),
                this.prisma.wallet.update({
                    where: { userId: userId },
                    data: {
                        bankAccountId: data.id
                    }
                })
            ]);

        }
        return { success: true }
    }
    async update(userId: string, id: string, dto: CreateBankAccountDto) {
        if (dto.isDefault) {
            await this.prisma.$transaction([
                this.prisma.bankAccount.updateMany({
                    where: {
                        userId,
                        id: { not: id },
                        isDefault: true,
                    },
                    data: { isDefault: false },
                }),
                this.prisma.bankAccount.update({
                    where: { id },
                    data: {
                        ...dto,
                        isDefault: true,
                    }
                }),
                this.prisma.wallet.update({
                    where: { userId: userId },
                    data: {
                        bankAccountId: id
                    }
                })
            ]);
        } else {
            await this.prisma.bankAccount.update({
                where: { id, userId },
                data: dto,
            });
        }
        return { success: true };
    }
    async delete(userId: string, id: string) {
        const bank = await this.prisma.bankAccount.delete({
            where: { id, userId }
        })
        if (bank.isDefault) {
            await this.prisma.wallet.update({
                where: { userId },
                data: { bankAccountId: null }
            })
        }
        return { success: true }
    }
}