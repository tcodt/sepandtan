import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, } from 'class-validator';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';
import { AccountStatus, DefaultStatus, OnBoardingStep, RolePerson, UserStatus } from '../../../generated/prisma/enums.js';
import { Transform, Type } from 'class-transformer';

export class QueryUserDto extends QueryDefaultDto {
    @IsOptional()
    @IsString()
    @ApiProperty({ example: '', required: false, description: 'جستجو در اسم و ایمیل و تلفن' })
    search?: string;

    @IsOptional()
    @IsIn([...Object.values(UserStatus), 'ALL'])
    @ApiProperty({
        enum: [...Object.values(UserStatus), 'ALL'],
        required: false,
        description: 'وضعیت کاربر',
    })
    status?: UserStatus | "ALL";

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @ApiPropertyOptional({ example: false, description: 'شماره تلفن تایید شده' })
    isPhoneVerified?: boolean;

    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @ApiPropertyOptional({ example: false, description: 'ایمیل تایید شده' })
    isEmailVerified?: boolean;

    @IsOptional()
    @IsIn([...Object.values(RolePerson), 'ALL'])
    @ApiProperty({
        enum: [...Object.values(RolePerson), 'ALL'],
        required: false,
        description: 'نقش کاربر',
    })
    role?: RolePerson | "ALL";
}

export class GetPendingStore extends QueryDefaultDto {
    @IsOptional()
    @IsIn([...Object.values(DefaultStatus), 'ALL'])
    @ApiProperty({
        enum: [...Object.values(DefaultStatus), 'ALL'],
        required: false,
        description: 'وضعیت فروشنده',
    })
    status?: DefaultStatus | "ALL";
}

export class GetPendingCoach extends QueryDefaultDto {
    @IsOptional()
    @IsIn([...Object.values(AccountStatus), 'ALL'])
    @ApiProperty({
        enum: [...Object.values(AccountStatus), 'ALL'],
        required: false,
        description: 'وضعیت مربی',
    })
    status?: AccountStatus | "ALL";
}

export class classOnBoardingDto {
    @IsIn([...Object.values(OnBoardingStep)])
    @ApiProperty({
        enum: [...Object.values(OnBoardingStep)],
        required: true,
        description: 'وضعیت آموزش'
    })
    onBoardingStep!: OnBoardingStep
}