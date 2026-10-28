import { ApiProperty } from '@nestjs/swagger';

class CountColor {
  @ApiProperty({ example: 0, description: 'تعداد واریانت‌های محصول' })
  productVariants?: number;
}

export class ColorEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  hexCode!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: CountColor, required: false })
  _count?: CountColor;
}


export class ColorPublicEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  hexCode!: string;

  @ApiProperty()
  slug!: string;
}