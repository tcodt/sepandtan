export type TicketStatus = "PENDING" | "WAITING" | "RESOLVED" | "CLOSED";
export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT" | "CRITICAL";

export type AdminTicketListItem = {
  id: string;
  title: string;
  status: TicketStatus | string;
  priority: TicketPriority | string;
  trackingCode: string | null;
  isUserRead: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  userName: string | null;
  orderId: string | null;
  orderNumber: string | null;
};

export type TicketMessage = {
  id: string;
  content: string;
  ticketId: string;
  senderId: string;
  senderName: string | null;
  senderRole: string | null;
  createdAt: string;
  images: string[];
};

export type AdminTicketDetail = AdminTicketListItem & {
  messages: TicketMessage[];
};

export type AdminTicketsFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  search?: string;
  status?: TicketStatus | "ALL";
  priority?: TicketPriority | "ALL";
};

export type AdminTicketsResponse = {
  data: AdminTicketListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  };
};

export type UpdateTicketInput = {
  status: TicketStatus;
  priority: TicketPriority;
  isUserRead: boolean;
};

export type TicketStats = {
  total?: number;
  pending?: number;
  waiting?: number;
  resolved?: number;
  closed?: number;
  [key: string]: number | undefined;
};
