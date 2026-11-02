import type { PaginationMeta } from "@/features/catalog/types";

export type TicketStatus =
  | "PENDING"
  | "WAITING"
  | "RESOLVED"
  | "CLOSED"
  | string;
export type TicketPriority =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "URGENT"
  | "CRITICAL"
  | string;

export type TicketListItem = {
  id: string;
  status: TicketStatus;
  priority: TicketPriority;
  title: string;
  trackingCode: string;
  isUserRead: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  orderId: string | null;
  order: {
    id: string;
    orderNumber: string;
    totalPrice: string;
  } | null;
};

export type TicketMessage = {
  id: string;
  content: string;
  ticketId: string;
  senderId: string;
  createdAt: string;
  updatedAt: string;
  images: Array<{ id: string; url: string }>;
  sender: { id: string; name: string; role: string };
};

export type TicketDetail = TicketListItem & {
  user: {
    id: string;
    name: string;
    role: string;
    phone: string | null;
  };
  ticketMessages: TicketMessage[];
};

export type TicketsResponse = {
  pagination: PaginationMeta;
  tickets: TicketListItem[];
};

export type TicketsFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
};

export type CreateTicketInput = {
  title: string;
  priority: TicketPriority;
  content: string;
  orderId?: string;
  images?: string[];
};

export type CreateTicketMessageInput = {
  content: string;
  images?: string[];
};

export type UpdateTicketInput = {
  status: TicketStatus;
  priority: TicketPriority;
  isUserRead: boolean;
};
