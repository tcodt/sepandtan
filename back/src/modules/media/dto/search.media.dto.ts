import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { MediaUseCase } from '../../../generated/prisma/enums.js';

export class SearchMediaDto {
    @IsOptional()
    @IsString()
    @ApiProperty({
        required: false,
        description: 'صفحه بندی',
    })
    page?: string

    @IsOptional()
    @IsString()
    @ApiProperty({
        required: false,
        description: 'تعداد نمایش عکس در صفحات',
    })
    limit?: string

    @ApiProperty({ description: 'فیلتر بر اساس وضعیت', enum: ['ALL', ...Object.values(MediaUseCase)] })
    @IsOptional()
    useCase?: MediaUseCase | "ALL";

    @IsOptional()
    @IsString()
    @ApiProperty({
        required: false,
        description: 'مرتب سازی',
    })
    order?: 'desc' | 'asc'

    @IsOptional()
    @IsString()
    @ApiProperty({
        required: false,
        description: 'عکس محصول یا صفحه اصلی',
    })
    isMain?: string

    @IsOptional()
    @IsString()
    @ApiProperty({
        required: false,
        description: 'ایدی محصول',
    })
    productId?: string

    @IsOptional()
    @IsString()
    @ApiProperty({
        required: false,
        description: 'آدرس محصول',
    })
    url?: string
}