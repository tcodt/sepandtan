import { ApiProperty } from '@nestjs/swagger';
import { MediaUseCase } from '../../../generated/prisma/enums.js';

export class MediaEntity {
    @ApiProperty()
    id!: string;

    @ApiProperty({ nullable: true })
    productId?: string | null;

    @ApiProperty({ nullable: true })
    reportsId?: string | null;

    @ApiProperty({ nullable: true })
    ticketMessageId?: string | null;

    @ApiProperty({ nullable: true })
    returnRequestId?: string | null;

    @ApiProperty()
    url!: string;

    @ApiProperty({ nullable: true })
    alt?: string | null;

    @ApiProperty({ enum: MediaUseCase })
    useCase!: MediaUseCase;

    @ApiProperty()
    sortOrder!: number;

    @ApiProperty()
    type!: string;

    @ApiProperty()
    isMain!: boolean;

    @ApiProperty()
    createdAt!: Date;
}
