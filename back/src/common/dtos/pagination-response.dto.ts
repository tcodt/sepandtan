import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

class PaginationMetaDto {
  @ApiProperty({ example: 2, description: 'صفحه بعد', nullable: true })
  nextPage!: number | null;

  @ApiProperty({ example: 1, description: 'صفحه قبل', nullable: true })
  prevPage!: number | null;

  @ApiProperty({ example: 100, description: 'تعداد کل آیتم‌ها' })
  total!: number;
}

export function PaginatedResponse<T>(TypeDto: Type<T>, key?: string) {
  const koling = key || 'data'
  class PaginatedResponseClass {
    @ApiProperty({ type: PaginationMetaDto, description: 'اطلاعات صفحه‌بندی' })
    pagination!: PaginationMetaDto

    @ApiProperty({
      type: [TypeDto],
      description: 'داده‌ها',
    })
    [koling]!: T[];
  }
  Object.defineProperty(PaginatedResponseClass, 'name', {
    value: `Paginated${TypeDto.name}`,
  });

  return PaginatedResponseClass;
}