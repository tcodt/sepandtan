import {
  IsOptional,
  IsString,
  IsEmail,
  Matches,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsBoolean,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// DTO برای یک کاربر فرضی با فیلدهای متنوع و اعتبارسنجی قوی

export class PostUserDto {
  @ApiProperty({ example: 'ali@example.com' })
  @IsString()
  @MinLength(3, { message: 'نام باید حداقل 3 کاراکتر باشد' })
  @MaxLength(30, { message: 'نام باید حداکثر 30 کاراکتر باشد' })
  username!: string;

  @ApiProperty({ example: 'ali@example.com' })
  @IsEmail({}, { message: 'ایمیل معتبر نیست' })
  email!: string;

  @IsString()
  // @MinLength(8, { message: 'پسورد باید حداقل 8 کاراکتر باشد' })
  // @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]+$/, {
  //   message:
  //     'پسورد باید حداقل یک حرف و یک عدد داشته باشد و می‌تواند شامل کاراکترهای خاص باشد',
  // })
  password?: string;

  @IsString()
  googleId?: string;

  //   @IsOptional()
  //   @IsInt()
  //   @Min(18, { message: 'حداقل سن باید 18 باشد' })
  //   @Max(100, { message: 'حداکثر سن باید 100 باشد' })
  //   age?: number;

  //   @IsOptional()
  //   @IsBoolean()
  //   @Transform(({ value }) => (value === 'true' || value === true ? true : false))
  //   isActive?: boolean;

  //   @IsOptional()
  //   @IsArray()
  //   @ArrayNotEmpty()
  //   @ArrayUnique()
  //   @IsString({ each: true })
  //   roles?: string[];

  //   @IsOptional()
  //   @IsObject()
  //   @ValidateNested()
  //   @Type(() => AddressDto)
  //   address?: AddressDto;
}

// کلاس آدرس به صورت nested DTO

// export class AddressDto {
//   @IsString()
//   street: string;

//   @IsString()
//   city: string;

//   @IsString()
//   country: string;

//   @IsOptional()
//   @IsString()
//   postalCode?: string;
// }
