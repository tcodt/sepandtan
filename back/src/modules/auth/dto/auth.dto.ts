import {
    IsString,
    IsEmail,
    MinLength,
    MaxLength,
    ValidatorConstraint,
    Validate,
    ValidatorConstraintInterface,
    ValidationArguments,
    IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

interface UserLikeObject {
    password?: string;
    googleId?: string;
}

@ValidatorConstraint({ name: 'eitherPasswordOrGoogleId', async: false })
class EitherPasswordOrGoogleIdConstraint implements ValidatorConstraintInterface {
    validate(_: any, args: ValidationArguments) {
        const obj = args.object as UserLikeObject;
        return !!(obj.password || obj.googleId);

    }
    defaultMessage(_args: ValidationArguments) {
        return 'حداقل رمز عبور یا گوگل ایدی الزامی است';
    }
}

export class LoginDto {
    @ApiProperty({ example: 'ali', required: true })
    @IsString()
    @MinLength(3, { message: 'نام باید حداقل 3 کاراکتر باشد' })
    @MaxLength(30, { message: 'نام باید حداکثر 30 کاراکتر باشد' })
    name!: string;

    @ApiProperty({ example: 'ali@example.com', required: true })
    @IsEmail({}, { message: 'ایمیل معتبر نیست' })
    email!: string;

    @ApiProperty({ example: '123', required: false, description: 'There is no need for a password when the user logs in with a Google account.' })
    @IsString()
    password?: string;

    @IsString()
    @ApiProperty({ example: '09390199977', required: false, description: 'There is no need for a password when the user logs in with a Google account.' })
    phone?: string;

    @ApiProperty({ example: '710927351', required: false, description: 'There is no need for a googleId when the user logs in with a Password.' })
    @IsString()
    googleId?: string;

    @ApiProperty({ example: false, required: false, description: 'this for remember me.' })
    @IsBoolean()
    remember?: boolean;
}
