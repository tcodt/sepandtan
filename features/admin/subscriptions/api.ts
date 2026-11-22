import { apiClient } from "@/lib/api/client";
import type {
  AdminSubscriptionFilters,
  AdminSubscriptionItem,
  AdminSubscriptionListResponse,
  AdminSubscriptionStatus,
} from "./types";

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const STATUSES: AdminSubscriptionStatus[] = [
  "PENDING",
  "ACTIVE",
  "TRIALING",
  "EXPIRED",
  "CANCELLED",
];

function normalizeStatus(raw: unknown): AdminSubscriptionStatus {
  const s = asString(raw)?.toUpperCase();
  if (s && STATUSES.includes(s as AdminSubscriptionStatus)) {
    return s as AdminSubscriptionStatus;
  }
  return "PENDING";
}

function mapItem(raw: unknown): AdminSubscriptionItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;

  const user = (r.user ?? {}) as Record<string, unknown>;
  const plan = (r.plan ?? r.subscriptionPlan ?? {}) as Record<string, unknown>;

  return {
    id,
    status: normalizeStatus(r.status),
    planId: asString(r.planId) ?? asString(plan.id),
    planTitle:
      asString(plan.title) ?? asString(plan.name) ?? asString(r.planTitle),
    userId: asString(r.userId) ?? asString(user.id),
    userName: asString(user.name) ?? asString(r.userName),
    startsAt: asString(r.startsAt) ?? asString(r.startDate),
    endsAt: asString(r.endsAt) ?? asString(r.endDate),
    createdAt: asString(r.createdAt),
  };
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of [
    "subscriptions",
    "subscription",
    "data",
    "items",
    "results",
  ]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

/** GET /subscription/admin/subscription */
export async function fetchAdminSubscriptions(
  filters: AdminSubscriptionFilters = {},
): Promise<AdminSubscriptionListResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const params: Record<string, string | number> = {
    page,
    limit,
    order: filters.order ?? "desc",
  };
  if (filters.status && filters.status !== "ALL") {
    params.status = filters.status;
  }

  const { data } = await apiClient.get("/subscription/admin/subscription", {
    params,
  });
  const root = (data ?? {}) as Record<string, unknown>;
  const items = extractList(root)
    .map(mapItem)
    .filter((x): x is AdminSubscriptionItem => x !== null);

  const pag = (root.pagination ?? root.meta ?? {}) as Record<string, unknown>;
  const total = num(pag.total, items.length);
  const totalPages =
    num(pag.totalPages, 0) || Math.max(1, Math.ceil(total / limit) || 1);

  return {
    data: items,
    pagination: {
      page: num(pag.page, page) || page,
      limit,
      total,
      totalPages,
    },
  };
}

/** PATCH /subscription/admin/subscription/{id}/status */
export async function updateAdminSubscriptionStatus(
  id: string,
  status: AdminSubscriptionStatus,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.patch(
    `/subscription/admin/subscription/${encodeURIComponent(id)}/status`,
    { status },
  );
}
