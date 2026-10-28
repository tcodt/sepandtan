import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';
import { QueryDefaultDto } from '../../../common/dtos/query.defualt.dto.js';
export class ColorSearchDto extends QueryDefaultDto {
  @ApiProperty({ description: 'نام رنگ', required: false })
  @IsString()
  @IsOptional()
  search?: string;
}