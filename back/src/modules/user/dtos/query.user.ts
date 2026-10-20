import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, } from 'class-validator';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';
import { RolePerson } from '../../../generated/prisma/enums.js';

export class QueryUserDto extends QueryDefaultDto {
    @IsOptional()
    @IsString()
    @ApiProperty({ example: 'ali', required: false, description: 'جستجو در بخش اسم و شماره تلفن' })
    search?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({ example: 'USER', required: false, description: 'نقش های کاربر' })
    role?: RolePerson | "ALL";
}