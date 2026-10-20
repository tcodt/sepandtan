import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, } from 'class-validator';

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
    CONTRACTOR = 'CONTRACTOR',
    AUTHOR = 'AUTHOR',
}

export class UpdateUserDto {
    @ApiProperty({ example: 'ali 123', required: false })
    @IsString()
    name?: string;

    @IsString()
    @ApiProperty({ enum: UserRole, example: 'USER', required: false })
    role?: UserRole;

    @IsString()
    @ApiProperty({ example: '123', required: false })
    password?: string;

    @IsString()
    @ApiProperty({ example: '09390199977', required: false })
    phone?: string;

    @IsEmail()
    @ApiProperty({ example: 'r.khani1385@gmail.com', required: false })
    email?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ example: 'e3e9586b-9680-477e-86af-5f10f8c17433', description: 'شناسه اختیاری برای آپدیت پروفایل دیگران' })
    id?: string;
}