import { ApiProperty } from '@nestjs/swagger';
export class UserEntity {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  phone?: string | null

  @ApiProperty()
  role?: string | null

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
