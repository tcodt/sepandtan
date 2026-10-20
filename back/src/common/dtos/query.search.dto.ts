// query-search.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';

export enum OrderDirection {
    ASC = 'asc',
    DESC = 'desc',
}

export class QuerySearchDto {
    @IsOptional()
    @IsEnum(OrderDirection)
    @ApiProperty({ example: 'desc', required: false, description: 'ترتیب داده‌ها', enum: OrderDirection, nullable: true })
    order?: OrderDirection;

    @IsOptional()
    @ApiProperty({ example: 1, required: false, description: 'شماره صفحه' })
    page?: number;

    @IsOptional()
    @ApiProperty({ example: "", required: false, description: 'متن جستجو', nullable: true })
    search?: string;

    @IsOptional()
    @ApiProperty({ example: 10, required: false, description: 'تعداد آیتم در هر صفحه' })
    limit?: number;
}
