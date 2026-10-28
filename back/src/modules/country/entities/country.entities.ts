import { ApiProperty } from '@nestjs/swagger';

class CountCountryProducts {
  @ApiProperty()
  products?: number;
}

export class CountryEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  flag?: string | null;

  @ApiProperty({ type: CountCountryProducts, required: false })
  _count?: CountCountryProducts;
}

export class CountryPublicEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  flag?: string | null;
}