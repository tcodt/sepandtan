import { ApiProperty } from '@nestjs/swagger';

class TicketOrderEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderNumber!: string;

  @ApiProperty({ description: 'مبلغ کل سفارش (به صورت رشته)' })
  totalPrice!: string;
}

export class TicketEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  priority!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  trackingCode!: string;

  @ApiProperty()
  isUserRead!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ nullable: true })
  orderId?: string | null;

  @ApiProperty({ type: TicketOrderEntity, nullable: true })
  order?: TicketOrderEntity | null;
}


class TicketUserEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  role!: string;

  @ApiProperty({ nullable: true })
  phone?: string | null;
}

class TicketMessageImageEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  url!: string;
}

class TicketMessageSenderEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  role!: string;
}

class TicketMessageEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  ticketId!: string;

  @ApiProperty()
  senderId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty({ type: [TicketMessageImageEntity] })
  images!: TicketMessageImageEntity[];

  @ApiProperty({ type: TicketMessageSenderEntity })
  sender!: TicketMessageSenderEntity;
}

// ===== Main Ticket =====

export class TicketDetailEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  priority!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  trackingCode!: string;

  @ApiProperty()
  isUserRead!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ nullable: true })
  orderId?: string | null;

  @ApiProperty({ type: TicketUserEntity })
  user!: TicketUserEntity;

  @ApiProperty({ type: TicketOrderEntity, nullable: true })
  order?: TicketOrderEntity | null;

  @ApiProperty({ type: [TicketMessageEntity] })
  ticketMessages!: TicketMessageEntity[];
}

// ===== User & Store =====

class AdminTicketUserStoreEntity {
  @ApiProperty()
  name!: string;
}

class AdminTicketUserEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ type: AdminTicketUserStoreEntity, nullable: true })
  store?: AdminTicketUserStoreEntity | null;
}

// ===== Order =====

class AdminTicketOrderEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  orderNumber!: string;

  @ApiProperty({ description: 'مبلغ کل سفارش (به صورت رشته)' })
  totalPrice!: string;

  @ApiProperty()
  status!: string;
}

// ===== Ticket =====

export class AdminTicketListEntity {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  priority!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  trackingCode!: string;

  @ApiProperty()
  isUserRead!: boolean;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;

  @ApiProperty()
  userId!: string;

  @ApiProperty({ nullable: true })
  orderId?: string | null;

  @ApiProperty({ type: AdminTicketUserEntity })
  user!: AdminTicketUserEntity;

  @ApiProperty({ type: AdminTicketOrderEntity, nullable: true })
  order?: AdminTicketOrderEntity | null;
}

// ===== Pagination =====

class PaginationMetaEntity {
  @ApiProperty()
  total!: number;
}

// ===== Final Response =====

export class AdminTicketListResponseEntity {
  @ApiProperty({ type: [AdminTicketListEntity] })
  tickets!: AdminTicketListEntity[];

  @ApiProperty({ type: PaginationMetaEntity })
  pagination!: PaginationMetaEntity;
}