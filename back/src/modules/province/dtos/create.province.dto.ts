import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProvinceDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: 'نام استان به فارسی',
        example: 'تهران',
        required: true
    })
    name!: string;
}

export class CreateCityDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: 'نام شهر',
        example: 'ورامین',
        required: true
    })
    name!: string;

    @IsString()
    @ApiProperty({
        description: 'آیدی استان',
        example: '3a1f0704-e93f-4ef5-989b-a81efdde1624',
        required: true
    })
    provinceId!: string;
}

export class UpdateCityDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: 'نام شهر',
        example: 'ورامین',
        required: true
    })
    name!: string;
}

export class GetCityByProvinceId {
    @IsOptional()
    @ApiProperty({
        description: 'آیدی استان  ',
        required: false
    })
    @IsString()
    provinceId?: string;
}