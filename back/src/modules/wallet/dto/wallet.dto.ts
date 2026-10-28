import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, MinLength, MaxLength, IsEnum, IsNumberString, } from 'class-validator';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';
import { WalletTransactionStatus, WalletTransactionType } from '../../../generated/prisma/enums.js';

export class WalletSearchDto extends QueryDefaultDto {
    @ApiProperty({ description: 'نام صاحب حساب (مطابق با کارت بانکی)', required: false })
    @IsOptional()
    @IsString()
    userId!: string;
}

export class WithdrawDto {
    @ApiProperty({ description: 'مبلغ مورد نظر برای برداشت', example: '50000' })
    @IsNotEmpty({ message: 'مبلغ برداشت الزامی است' })
    @IsNumberString({}, { message: 'مبلغ باید به صورت رشته عددی باشد' })
    amount!: string;
}

export class WalletTransactionSearchDto extends QueryDefaultDto {
    @ApiProperty({ description: 'اولویت تیکت', required: false })
    @IsOptional()
    @IsEnum(WalletTransactionType)
    @IsString()
    type!: WalletTransactionType | 'all';

    @ApiProperty({ description: 'اولویت تیکت', required: false })
    @IsOptional()
    @IsEnum(WalletTransactionStatus)
    @IsString()
    status!: WalletTransactionStatus | 'all';

    @ApiProperty({ description: 'نام صاحب حساب (مطابق با کارت بانکی)', required: false })
    @IsOptional()
    @IsString()
    trackingCode!: string;

    @ApiProperty({ description: 'نام صاحب حساب (مطابق با کارت بانکی)', required: false })
    @IsOptional()
    @IsString()
    userId!: string;
}