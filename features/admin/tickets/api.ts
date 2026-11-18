import { apiClient } from "@/lib/api/client";
import type {
  AdminTicketDetail,
  AdminTicketListItem,
  AdminTicketsFilters,
  AdminTicketsResponse,
  TicketMessage,
  TicketStats,
  UpdateTicketInput,
} from "./types";

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (v && typeof v === "object" && "value" in v) {
    return asString((v as { value: unknown }).value);
  }
  return null;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function asBool(v: unknown): boolean {
  return v === true || v === "true" || v === 1;
}

function mapListItem(raw: unknown): AdminTicketListItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;

  const user = (r.user ?? {}) as Record<string, unknown>;
  const order = (r.order ?? {}) as Record<string, unknown>;

  return {
    id,
    title: asString(r.title) || "—",
    status: asString(r.status) || "PENDING",
    priority: asString(r.priority) || "MEDIUM",
    trackingCode: asString(r.trackingCode),
    isUserRead: asBool(r.isUserRead),
    createdAt: asString(r.createdAt) || "",
    updatedAt: asString(r.updatedAt) || "",
    userId: asString(r.userId) || asString(user.id),
    userName: asString(user.name),
    orderId: asString(r.orderId) || asString(order.id),
    orderNumber: asString(order.orderNumber),
  };
}

function mapMessage(raw: unknown): TicketMessage | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;
  const sender = (r.sender ?? {}) as Record<string, unknown>;
  const imagesRaw = Array.isArray(r.images) ? r.images : [];
  const images = imagesRaw
    .map((img) => {
      if (typeof img === "string") return img;
      return asString((img as Record<string, unknown>)?.url);
    })
    .filter((x): x is string => Boolean(x));

  return {
    id,
    content: asString(r.content) || "",
    ticketId: asString(r.ticketId) || "",
    senderId: asString(r.senderId) || asString(sender.id) || "",
    senderName: asString(sender.name),
    senderRole: asString(sender.role),
    createdAt: asString(r.createdAt) || "",
    images,
  };
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of ["tickets", "data", "items", "results"]) {
    const v = root[key];
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

/** GET /tickets/admin/all */
export async function fetchAdminTickets(
  filters: AdminTicketsFilters = {},
): Promise<AdminTicketsResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const { data } = await apiClient.get("/tickets/admin/all", {
    params: {
      page,
      limit,
      order: filters.order ?? "desc",
      search: filters.search || undefined,
      status:
        filters.status && filters.status !== "ALL" ? filters.status : undefined,
      priority:
        filters.priority && filters.priority !== "ALL"
          ? filters.priority
          : undefined,
    },
  });

  const root = (data ?? {}) as Record<string, unknown>;
  const items = extractList(root)
    .map(mapListItem)
    .filter((x): x is AdminTicketListItem => x !== null);

  const pag = (root.pagination ?? root.meta ?? {}) as Record<string, unknown>;
  const total = num(pag.total, items.length);
  const totalPages =
    num(pag.totalPages, 0) || Math.max(1, Math.ceil(total / limit));
  const currentPage = num(pag.page, page) || page;

  return {
    data: items,
    pagination: {
      page: currentPage,
      limit,
      total,
      totalPages,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
    },
  };
}

/** GET /tickets/admin/stats */
export async function fetchTicketStats(): Promise<TicketStats> {
  const { data } = await apiClient.get("/tickets/admin/stats");
  const r = (data ?? {}) as Record<string, unknown>;
  return {
    total: num(r.total, 0),
    pending: num(r.pending ?? r.PENDING, 0),
    waiting: num(r.waiting ?? r.WAITING, 0),
    resolved: num(r.resolved ?? r.RESOLVED, 0),
    closed: num(r.closed ?? r.CLOSED, 0),
  };
}

/** GET /tickets/{id} */
export async function fetchTicketById(id: string): Promise<AdminTicketDetail> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  const { data } = await apiClient.get(`/tickets/${encodeURIComponent(id)}`);
  const r = (data ?? {}) as Record<string, unknown>;
  const base = mapListItem(r);
  if (!base) throw new Error("تیکت پیدا نشد");

  const messagesRaw = Array.isArray(r.messages) ? r.messages : [];
  const messages = messagesRaw
    .map(mapMessage)
    .filter((x): x is TicketMessage => x !== null)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  return { ...base, messages };
}

/** PATCH /tickets/{id} — UpdateTicketDto */
export async function updateTicket(
  id: string,
  input: UpdateTicketInput,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.patch(`/tickets/${encodeURIComponent(id)}`, {
    status: input.status,
    priority: input.priority,
    isUserRead: input.isUserRead,
  });
}

/** POST /tickets/{id}/messages */
export async function replyToTicket(
  id: string,
  content: string,
  images?: string[],
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  if (!content.trim()) throw new Error("متن پیام خالی است");
  await apiClient.post(`/tickets/${encodeURIComponent(id)}/messages`, {
    content: content.trim(),
    ...(images?.length ? { images } : {}),
  });
}

/** DELETE /tickets/{id} */
export async function deleteTicket(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.delete(`/tickets/${encodeURIComponent(id)}`);
}
