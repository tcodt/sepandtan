import { ApiProperty } from '@nestjs/swagger';

export class CategoryTreeEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  icon?: string | null;

  @ApiProperty({ nullable: true })
  image?: string | null;

  @ApiProperty({ nullable: true })
  parentId?: string | null;

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty({ type: () => [CategoryTreeEntity] })
  children!: CategoryTreeEntity[];
}


class CategoryCountEntity {
  @ApiProperty()
  products!: number;
}

export class CategoryAdminEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  parentId?: string | null;

  @ApiProperty({ nullable: true })
  icon?: string | null;

  @ApiProperty({ nullable: true })
  image?: string | null;

  @ApiProperty({ type: [String] })
  ancestorIds!: string[];

  @ApiProperty()
  sortOrder!: number;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ nullable: true })
  metaTitle?: string | null;

  @ApiProperty({ nullable: true })
  metaDescription?: string | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: () => [CategoryTreeEntity] })
  children!: CategoryTreeEntity[];

  @ApiProperty({ type: CategoryCountEntity })
  _count!: CategoryCountEntity;
}

export class CategorySelectorEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;
}