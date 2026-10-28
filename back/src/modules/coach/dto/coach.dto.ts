import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
    IsBoolean,
    IsDateString,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    MaxLength,
    Min,
} from 'class-validator';
import { CoachStatus } from '../../../generated/prisma/enums.js';

export class CreateCoachDto {
    @ApiPropertyOptional({
        description: 'آیا مربی در حال حاضر مشتری جدید می‌پذیرد',
        type: Boolean,
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    @Transform(({ value }) => {
        if (typeof value === 'boolean') return value;
        if (value === 'true') return true;
        if (value === 'false') return false;
        return value; // ❌ به false تبدیل نکن — بذار اعتبارسنجی رد کنه
    })
    isAcceptingClients?: boolean;

    @ApiPropertyOptional({
        description: 'عنوان/تیتر مربی',
        example: 'مربی بدنسازی و تغذیه',
    })
    @IsOptional()
    @IsString()
    @MaxLength(150)
    headline?: string;

    @ApiPropertyOptional({
        description: 'بیوگرافی مربی',
        example: 'دارای ۵ سال سابقه مربیگری...',
    })
    @IsOptional()
    @IsString()
    @MaxLength(2000)
    bio?: string;

    @ApiPropertyOptional({
        description: 'دلیل رد شدن (فقط توسط ادمین تنظیم می‌شود)',
        example: 'دلیل رد شدن (فقط توسط ادمین تنظیم می‌شود) کاربر مجاز به ارسال نیست',
    })
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    rejectionReason?: string;

    @ApiPropertyOptional({
        description: 'حداکثر تعداد مشتری',
        example: 20,
        minimum: 0,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    maxClients?: number;

    @ApiPropertyOptional({
        description: 'درصد کمیسیون (0 تا 100) فقط باید توسط ادمین تغییر بکنه برای مربی نمایش نده',
        example: 15.5,
        minimum: 0,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({ maxDecimalPlaces: 2 })
    @Min(0)
    @Max(100)
    commissionRate?: number;

    @ApiPropertyOptional({
        description: 'آدرس',
        example: 'تهران، خیابان ولیعصر...',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    address?: string;

    @ApiPropertyOptional({
        description: 'شناسه شهر',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @IsOptional()
    @IsUUID('4', { message: 'شناسه شهر باید UUID باشد' })
    cityId?: string;

    @ApiPropertyOptional({
        description: 'شناسه استان',
        example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    })
    @IsOptional()
    @IsUUID('4', { message: 'شناسه استان باید UUID باشد' })
    provinceId?: string;

    @ApiPropertyOptional({
        description: 'آیدی اینستاگرام',
        example: 'coach_ali',
    })
    @IsOptional()
    @IsString()
    @MaxLength(100)
    instagram?: string;

    @ApiPropertyOptional({ description: 'سال‌های تجربه', example: '2026-10-24T21:24:44.150Z', format: 'date' })
    @IsOptional()
    @IsString()
    experienceYears?: string; // در سرویس به Date تبدیل شود

    @ApiPropertyOptional({
        description: 'کد ملی',
        example: '0012345678',
    })
    @IsOptional()
    @IsString()
    @MaxLength(10)
    nationalId?: string;

    @ApiProperty({
        description: 'وضعیت مربی',
        enum: CoachStatus,
        example: CoachStatus.PENDING,
    })
    @IsEnum(CoachStatus)
    status!: CoachStatus;
}