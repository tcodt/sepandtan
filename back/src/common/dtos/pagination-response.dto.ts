import { ApiProperty } from '@nestjs/swagger';
import { Type } from '@nestjs/common';

export function PaginatedResponse<T>(TypeDto: Type<T>) {
  class PaginatedResponseClass {
    @ApiProperty({ example: 2, description: 'صفحه بعد' })
    nextPage!: number;

    @ApiProperty({ example: 1, description: 'صفحه قبل' })
    prevPage!: number;

    @ApiProperty({ example: 100, description: 'تعداد کل آیتم‌ها' })
    total!: number;

    @ApiProperty({
      type: [TypeDto],
      description: 'داده‌ها',
    })
    data!: T[];
  }

  Object.defineProperty(PaginatedResponseClass, 'name', {
    value: `Paginated${TypeDto.name}`,
  });

  return PaginatedResponseClass;
}