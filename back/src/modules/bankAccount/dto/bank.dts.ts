import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, MinLength, MaxLength, } from 'class-validator';
export class CreateBankAccountDto {
    @ApiProperty({
        description: 'نام بانک (مثلاً ملی، صادرات، ...)',
        example: 'ملی',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    bankName!: string;

    @ApiProperty({
        description: 'نام بانک (مثلاً ملی، صادرات، ...)',
        example: 'ملی',
        required: true,
    })
    @IsString()
    walletId!: string;

    @ApiProperty({
        description: 'نام صاحب حساب (مطابق با کارت بانکی)',
        example: 'علی رضایی',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    accountHolder!: string;

    @ApiProperty({
        description: 'شماره شبا (۲۴ رقمی، با IR شروع می‌شود)',
        example: 'IR012345678901234567890123',
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(24)
    @MaxLength(26)
    iban!: string;

    @ApiPropertyOptional({
        description: 'شماره کارت (۱۶ رقمی)',
        example: '6037997500000000',
    })
    @IsOptional()
    @IsString()
    @MinLength(16)
    @MaxLength(16)
    cardNumber!: string;

    @ApiPropertyOptional({
        description: 'آیا این حساب به‌عنوان پیش‌فرض انتخاب شود؟',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isDefault!: boolean;

    @ApiPropertyOptional({
        description: 'آیا این حساب به‌عنوان پیش‌فرض انتخاب شود؟',
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isVerified!: boolean;
}