import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsUUID,
  IsEnum,
  MaxLength,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';
import { PlanRequestStatus } from '../../../generated/prisma/enums.js';

// ═════════ ورودی ثبت درخواست (User) ═════════

export class CreatePlanRequestDto {
  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description:
      'آیدی برنامه‌ی ورزشی منتشرشده. اگر نباشد، فقط وقتی مجاز است که کاربر برنامه‌ی ورزشی فعال داشته باشد (درخواست «فقط غذایی»)',
  })
  @IsOptional()
  @IsUUID('4')
  workoutTemplateId?: string;

  @ApiProperty({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'آیدی مربی (از روی برنامه‌های انتخاب‌شده تعیین می‌شود، اما برای اعتبارسنجی اجباری است)',
  })
  @IsUUID('4')
  coachId!: string;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'آیدی برنامه‌ی غذایی منتشرشده؛ باید از همان مربی‌ی برنامه‌ی ورزشی باشد. حداقل یکی از دو برنامه الزامی است',
  })
  @IsOptional()
  @IsUUID('4')
  dietTemplateId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://cdn.example.com/body-front.jpg'],
    description: 'حداکثر ۵ عکس (مثلاً عکس بدن) برای مربی',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  images?: string[];

  @ApiPropertyOptional({
    example: 'کمردرد خفیف دارم و فقط سه روز در هفته وقت دارم',
    description: 'توضیح برای مربی',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

// ═════════ ورودی رد درخواست (Coach) ═════════

export class RejectPlanRequestDto {
  @ApiProperty({
    example: 'در حال حاضر ظرفیت ندارم',
    description: 'دلیل رد درخواست (به کاربر نمایش داده می‌شود)',
  })
  @IsString()
  @MinLength(3)
  @MaxLength(500)
  reason!: string;
}

// ═════════ Query برای لیست درخواست‌ها ═════════

export class PlanRequestQueryDto extends QueryDefaultDto {
  @ApiPropertyOptional({
    enum: [...Object.values(PlanRequestStatus)],
    description: 'فیلتر بر اساس وضعیت درخواست',
  })
  @IsOptional()
  @IsEnum(PlanRequestStatus)
  status?: PlanRequestStatus;
}

export class PlanRequestQueryAdminDto extends PlanRequestQueryDto {
  @ApiProperty({
    required: false,
    description: 'آیدی مربی',
  })
  @IsOptional()
  coachId?: string;
}

export class PlanRequestAdminDto {
  @ApiPropertyOptional({
    enum: [...Object.values(PlanRequestStatus)],
    description: 'وضعیت درخواست',
    example: PlanRequestStatus.ACCEPTED
  })
  @IsOptional()
  @IsEnum(PlanRequestStatus)
  status?: PlanRequestStatus;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: ''
  })
  @IsOptional()
  dietTemplateId?: string;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'توضیحات شاگرد به مربی'
  })
  @IsOptional()
  note?: string;

  @ApiPropertyOptional({
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    description: 'توضیحات مربی به شاگرد در زمان رد شاگرد'
  })
  @IsOptional()
  rejectionReason?: string;
}