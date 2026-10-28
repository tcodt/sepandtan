import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';

export class ReviewSearchDto extends QueryDefaultDto {
    @IsOptional()
    @Transform(({ value }) => value === 'true' || value === true)
    @IsBoolean()
    @ApiPropertyOptional({ example: false, description: 'وضعیت تایید نظر' })
    isApproved?: boolean;

    @ApiPropertyOptional({ description: 'فیلتر بر اساس شناسه محصول' })
    @IsOptional()
    @IsString()
    productId?: string;
}