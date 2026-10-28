import { ApiProperty } from '@nestjs/swagger';
import { BankAccountEntity } from '../../bankAccount/entities/bank.entity.js';

class WalletUserEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty({ nullable: true })
    email?: string | null;

    @ApiProperty()
    name!: string;

    @ApiProperty()
    password!: string;

    @ApiProperty({ nullable: true })
    googleId?: string | null;

    @ApiProperty({ nullable: true })
    phone?: string | null;

    @ApiProperty()
    role!: string;

    @ApiProperty()
    status!: string;

    @ApiProperty()
    isPhoneVerified!: boolean;

    @ApiProperty()
    isEmailVerified!: boolean;

    @ApiProperty()
    createdAt!: Date;

    @ApiProperty()
    updatedAt!: Date;
}
export class WalletEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    userId!: string;

    @ApiProperty({ description: 'موجودی فعلی (به صورت رشته)' })
    balance!: string;

    @ApiProperty({ description: 'موجودی در انتظار تایید (به صورت رشته)' })
    pendingBalance!: string;

    @ApiProperty({ description: 'موجودی قابل برداشت (به صورت رشته)' })
    withdrawBalance!: string;

    @ApiProperty({ description: 'موجودی مسدود شده (به صورت رشته)' })
    frozenBalance!: string;

    @ApiProperty()
    isPlatform!: boolean;

    @ApiProperty({ nullable: true })
    bankAccountId?: string | null;

    @ApiProperty()
    updatedAt!: Date;

    @ApiProperty()
    createdAt!: Date;
}
export class DetailWalletEntity extends WalletEntity {
    @ApiProperty({ type: [BankAccountEntity] })
    bankAccounts!: BankAccountEntity[];

    @ApiProperty({ type: WalletUserEntity })
    user!: WalletUserEntity;
}