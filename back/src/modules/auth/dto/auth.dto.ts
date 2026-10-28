// src/modules/auth/dto/auth.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

/**
 * ثبت‌نام با یکی از دو روش:
 *  ۱) name + email + password
 *  ۲) googleIdToken (ID token ای که گوگل به فرانت می‌ده؛ ایمیل و نام از خود گوگل خونده می‌شه)
 */
export class RegisterDto {
  @ApiPropertyOptional({ description: 'برای ثبت‌نام با گوگل لازم نیست', example: 'ali' })
  @ValidateIf((o: RegisterDto) => !o.googleIdToken)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;


  @ApiPropertyOptional({ description: 'برای ثبت‌نام با گوگل لازم نیست', example: 'ali@gmail.com' })
  @ValidateIf((o: RegisterDto) => !o.googleIdToken)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '09123456789' })
  @IsOptional()
  @Matches(/^09\d{9}$/, { message: 'شماره موبایل معتبر نیست' })
  phone?: string;

  @ApiPropertyOptional({ description: 'حداقل ۸ و حداکثر ۷۲ کاراکتر', example: '123' })
  @ValidateIf((o: RegisterDto) => !o.googleIdToken)
  @IsString()
  // @MinLength(8)
  // @MaxLength(72)
  password?: string;

  @ApiPropertyOptional({ description: 'ID token گوگل؛ به‌جای name / email / password', example: '' })
  @ValidateIf((o: RegisterDto) => !o.password)
  @IsString()
  googleIdToken?: string;
}

/** ورود با email + password یا با googleIdToken */
export class LoginDto {
  @ApiPropertyOptional({
    example: 'ali@gmail.com'
  })
  @ValidateIf((o: LoginDto) => !o.googleIdToken)
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '123' })
  @ValidateIf((o: LoginDto) => !o.googleIdToken)
  @IsString()
  // @MaxLength(72)
  password?: string;

  @ApiPropertyOptional({ description: 'ID token گوگل؛ به‌جای email و password', example: '' })
  @ValidateIf((o: LoginDto) => !o.email && !o.password)
  @IsString()
  googleIdToken?: string;
}
