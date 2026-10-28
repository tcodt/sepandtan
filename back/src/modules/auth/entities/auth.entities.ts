import { ApiProperty } from '@nestjs/swagger';
import { RolePerson } from '../../../generated/prisma/enums.js';
export class AuthEntities {
  @ApiProperty({ required: false })
  id!: string;

  @ApiProperty({ required: false })
  name!: string;

  @ApiProperty({ required: false })
  email?: null | string

  @ApiProperty({ nullable: true, required: false, example: 'google-uid-123' })
  googleId?: null | string

  @ApiProperty({ nullable: true, required: false, example: '09390199977', type: 'string' })
  phone?: null | string

  @ApiProperty({ example: 'USER', required: false, enum: RolePerson })
  role?: RolePerson;
}
