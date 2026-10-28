import { ApiProperty } from '@nestjs/swagger';

export class BankAccountEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  bankName!: string;

  @ApiProperty()
  accountHolder!: string;

  @ApiProperty({ description: 'شماره شبا (IBAN)' })
  iban!: string;

  @ApiProperty({ description: 'شماره کارت' })
  cardNumber!: string;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty()
  isVerified!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  walletId!: string;
}