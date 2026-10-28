import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, Min, Max, IsOptional, IsIn, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CreateReviewDto {
  @ApiProperty({ description: 'شناسه محصول', example: '8351bf0e-0cc9-4db3-8db3-677739fb4039' })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiPropertyOptional({ description: 'شناسه سفارش مرتبط بعدا بر اساس خرید هاشون پیامک میفرستیم و شناسه سفارش رو اینطوری میگیریم فعلا اجباری نیست', example: '8351bf0e-0cc9-4db3-8db3-677739fb4039' })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'امتیاز از ۱ تا ۵', minimum: 1, maximum: 5, example: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  rating!: number;

  @ApiPropertyOptional({ description: 'عنوان نظر', example: 'عنوان یا تایتل' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ description: 'متن اصلی نظر', example: 'متن اصلی کامنت' })
  @IsString()
  @IsNotEmpty()
  body!: string;
}

export class GetReviewsQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}

export class ReviewSearchDto extends GetReviewsQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @ApiPropertyOptional({ example: false, description: 'وضعیت تایید (true یا false)' })
  isApproved?: boolean;

  @ApiPropertyOptional({ description: 'فیلتر بر اساس محصول' })
  @IsOptional()
  @IsString()
  productId?: string;
}

export class ModerateReviewDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  @ApiPropertyOptional({ example: false, description: 'وضعیت تایید (true یا false)' })
  isApproved?: boolean;
}

export class AnswerReviewDto {
  @ApiProperty({ description: 'پاسخ ادمین/فروشنده به نظر' ,example:'خواهش میکنم'})
  @IsString()
  @IsNotEmpty()
  answer!: string;
}