import { apiClient } from "@/lib/api/client";
import {
  asArray,
  asString,
  mapPagination,
  resolveMediaUrl,
} from "@/features/catalog/utils";
import type {
  CreateTicketInput,
  CreateTicketMessageInput,
  TicketDetail,
  TicketListItem,
  TicketMessage,
  TicketsFilters,
  TicketsResponse,
  UpdateTicketInput,
} from "./types";

function mapTicketListItem(raw: unknown): TicketListItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;
  const order = r.order as Record<string, unknown> | null | undefined;
  return {
    id,
    status: asString(r.status) ?? "PENDING",
    priority: asString(r.priority) ?? "MEDIUM",
    title: asString(r.title) ?? "",
    trackingCode: asString(r.trackingCode) ?? "",
    isUserRead: Boolean(r.isUserRead),
    createdAt: asString(r.createdAt) ?? "",
    updatedAt: asString(r.updatedAt) ?? "",
    userId: asString(r.userId) ?? "",
    orderId: asString(r.orderId),
    order: order
      ? {
          id: asString(order.id) ?? "",
          orderNumber: asString(order.orderNumber) ?? "",
          totalPrice: asString(order.totalPrice) ?? "0",
        }
      : null,
  };
}

function mapMessage(raw: unknown): TicketMessage | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;
  const sender = (r.sender ?? {}) as Record<string, unknown>;
  return {
    id,
    content: asString(r.content) ?? "",
    ticketId: asString(r.ticketId) ?? "",
    senderId: asString(r.senderId) ?? "",
    createdAt: asString(r.createdAt) ?? "",
    updatedAt: asString(r.updatedAt) ?? "",
    images: asArray(r.images).map((img) => {
      const ir = (img ?? {}) as Record<string, unknown>;
      const path = asString(ir.url) ?? "";
      return {
        id: asString(ir.id) ?? "",
        url: resolveMediaUrl(path),
      };
    }),
    sender: {
      id: asString(sender.id) ?? "",
      name: asString(sender.name) ?? "",
      role: asString(sender.role) ?? "",
    },
  };
}

function mapTicketDetail(raw: unknown): TicketDetail | null {
  const base = mapTicketListItem(raw);
  if (!base) return null;
  const r = (raw ?? {}) as Record<string, unknown>;
  const user = (r.user ?? {}) as Record<string, unknown>;
  return {
    ...base,
    user: {
      id: asString(user.id) ?? "",
      name: asString(user.name) ?? "",
      role: asString(user.role) ?? "",
      phone: asString(user.phone),
    },
    ticketMessages: asArray(r.ticketMessages ?? r.messages)
      .map(mapMessage)
      .filter((m): m is TicketMessage => m !== null),
  };
}

function mapTicketsResponse(data: unknown): TicketsResponse {
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.tickets ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    tickets: list
      .map(mapTicketListItem)
      .filter((t): t is TicketListItem => t !== null),
  };
}

/** GET /tickets — User */
export async function fetchMyTickets(
  filters: TicketsFilters = {},
): Promise<TicketsResponse> {
  const { data } = await apiClient.get("/tickets", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,
      order: filters.order ?? "desc",
      search: filters.search || undefined,
      status: filters.status,
      priority: filters.priority,
    },
  });
  return mapTicketsResponse(data);
}

/** GET /tickets/admin/all */
export async function fetchAdminTickets(
  filters: TicketsFilters = {},
): Promise<TicketsResponse> {
  const { data } = await apiClient.get("/tickets/admin/all", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      order: filters.order ?? "desc",
      search: filters.search || undefined,
      status: filters.status,
      priority: filters.priority,
    },
  });
  return mapTicketsResponse(data);
}

/** GET /tickets/{id} */
export async function fetchTicketById(
  id: string,
): Promise<TicketDetail | null> {
  const { data } = await apiClient.get(`/tickets/${id}`);
  return mapTicketDetail(data);
}

/** POST /tickets */
export async function createTicket(
  payload: CreateTicketInput,
): Promise<unknown> {
  const { data } = await apiClient.post("/tickets", payload);
  return data;
}

/** POST /tickets/{id}/messages */
export async function addTicketMessage(
  ticketId: string,
  payload: CreateTicketMessageInput,
): Promise<unknown> {
  const { data } = await apiClient.post(
    `/tickets/${ticketId}/messages`,
    payload,
  );
  return data;
}

/** PATCH /tickets/{id} — Admin */
export async function updateTicket(
  id: string,
  payload: UpdateTicketInput,
): Promise<void> {
  await apiClient.patch(`/tickets/${id}`, payload);
}

/** PATCH /tickets/{id}/read — User */
export async function markTicketRead(id: string): Promise<void> {
  await apiClient.patch(`/tickets/${id}/read`);
}

/** DELETE /tickets/{id} — Admin */
export async function deleteTicket(id: string): Promise<void> {
  await apiClient.delete(`/tickets/${id}`);
}

/** GET /tickets/admin/stats */
export async function fetchTicketStats(): Promise<unknown> {
  const { data } = await apiClient.get("/tickets/admin/stats");
  return data;
}
