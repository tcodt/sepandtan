import { ApiProperty } from "@nestjs/swagger";

export class BrandEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty()
    slug!: string;

    @ApiProperty()
    logo!: string;
}

class BrandCountEntity {
    @ApiProperty()
    products!: number;
}

export class BrandAdminEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    name!: string;

    @ApiProperty()
    slug!: string;

    @ApiProperty({ nullable: true })
    logo?: string | null;

    @ApiProperty({ nullable: true })
    description?: string | null;

    @ApiProperty()
    sortOrder!: number;

    @ApiProperty({ type: BrandCountEntity })
    _count!: BrandCountEntity;
}