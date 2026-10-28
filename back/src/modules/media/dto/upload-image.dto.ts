// src/modules/media/dto/upload-image.dto.ts
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { MediaUseCase, TypeMedia } from '../../../generated/prisma/enums.js';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';

const emptyToUndefined = ({ value }: { value: unknown }) => (value === '' ? undefined : value);

const toOptionalInt = ({ value }: { value: unknown }) => value === '' || value === null || value === undefined ? undefined : Number(value);

const toOptionalBoolean = ({ value }: { value: unknown }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value === '' ? undefined : value;
};

export class UploadImageDto {
    @ApiPropertyOptional({ description: 'متن جایگزین تصویر (alt)', example: 'هودی مشکی' })
    @IsOptional()
    @IsString()
    alt?: string;

    @ApiPropertyOptional({ description: 'شناسه‌ی محصول', format: 'uuid' })
    @Transform(emptyToUndefined)
    @IsOptional()
    @IsUUID()
    productId?: string;

    @ApiPropertyOptional({ description: 'شناسه‌ی گزارش', format: 'uuid' })
    @Transform(emptyToUndefined)
    @IsOptional()
    @IsUUID()
    reportsId?: string;

    @ApiPropertyOptional({ description: 'شناسه‌ی پشتیبانی', format: 'uuid' })
    @Transform(emptyToUndefined)
    @IsOptional()
    @IsUUID()
    ticketMessageId?: string;

    @ApiPropertyOptional({ description: 'شناسه‌ی درخواست', format: 'uuid' })
    @Transform(emptyToUndefined)
    @IsOptional()
    @IsUUID()
    returnRequestId?: string;

    @ApiPropertyOptional({ description: 'ترتیب نمایش', example: 0 })
    @Transform(toOptionalInt)
    @IsOptional()
    @IsInt()
    @Min(0)
    sortOrder?: number;

    @ApiPropertyOptional({ description: 'تصویر اصلی؟', example: false })
    @Transform(toOptionalBoolean)
    @IsOptional()
    @IsBoolean()
    isMain?: boolean;

    @ApiPropertyOptional({ enum: MediaUseCase, enumName: 'MediaUseCase', default: 'AVATAR' })
    @Transform(emptyToUndefined)
    @IsOptional()
    @IsEnum(MediaUseCase)
    useCase?: MediaUseCase;

    @ApiPropertyOptional({ enum: TypeMedia, enumName: 'TypeMedia', default: 'IMAGE' })
    @Transform(emptyToUndefined)
    @IsOptional()
    @IsEnum(TypeMedia)
    type?: TypeMedia;
}

export class UploadImageSwaggerDto extends UploadImageDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'فایل تصویر (حداکثر ۱۰ مگابایت)',
    })
    file!: unknown;
}

/**
 * آپلود عمومی (تصویر، ویدیو، صدا، سند): همون فیلدهای بالا، بدون `type`.
 * نوع از روی محتوای واقعی فایل تشخیص داده می‌شه و از کلاینت قبول نمی‌شه.
 */
export class UploadMediaDto extends OmitType(UploadImageDto, ['type'] as const) { }

export class UploadMediaSwaggerDto extends UploadMediaDto {
    @ApiProperty({
        type: 'string',
        format: 'binary',
        description:
            'تصویر (jpg, png, webp, gif, avif) تا ۱۰MB — ویدیو (mp4, webm, mov) تا ۳۰۰MB — صدا (mp3, m4a, ogg, wav, aac, flac) تا ۵۰MB — سند (pdf, docx, xlsx, pptx) تا ۲۰MB',
    })
    file!: unknown;
}