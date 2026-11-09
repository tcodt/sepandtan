import { apiClient } from "@/lib/api/client";
import { fetchAdminUsers } from "@/features/admin/users/api";
import { fetchAdminStores } from "@/features/admin/stores/api";
import { fetchAdminProducts } from "@/features/products/api";
import { fetchTicketStats } from "@/features/tickets/api";
import { fetchReportStats } from "@/features/reports/api";
import type {
  AdminOverviewSnapshot,
  ProductStatusBreakdown,
  ReportStatsNormalized,
  RoleBreakdown,
  StatusBreakdown,
  TicketStatsNormalized,
} from "./overview-types";

function emptyRoles(): RoleBreakdown {
  return {
    USER: 0,
    COACH: 0,
    STORE: 0,
    ADMIN: 0,
    SUPERADMIN: 0,
    AUTHOR: 0,
    other: 0,
  };
}

function emptyStatus(): StatusBreakdown {
  return { ACTIVE: 0, SUSPENDED: 0, DELETED: 0, other: 0 };
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) {
    return Number(v);
  }
  return null;
}

function normalizeKeyedStats(raw: unknown): {
  total: number;
  map: Record<string, number>;
} {
  const map: Record<string, number> = {};
  if (!raw || typeof raw !== "object") return { total: 0, map };

  const r = raw as Record<string, unknown>;
  const source =
    r.stats && typeof r.stats === "object"
      ? (r.stats as Record<string, unknown>)
      : r.data && typeof r.data === "object" && !Array.isArray(r.data)
        ? (r.data as Record<string, unknown>)
        : r;

  for (const [k, v] of Object.entries(source)) {
    if (k === "pagination" || k === "meta") continue;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const count = asNumber((v as Record<string, unknown>).count);
      if (count != null) map[k.toUpperCase()] = count;
      continue;
    }
    const n = asNumber(v);
    if (n != null) map[k.toUpperCase()] = n;
  }

  const total =
    asNumber(r.total) ?? Object.values(map).reduce((s, n) => s + n, 0);

  return { total, map };
}

function mapTicketStats(raw: unknown): TicketStatsNormalized {
  const { total, map } = normalizeKeyedStats(raw);
  return {
    total,
    pending: map.PENDING ?? map.OPEN_PENDING ?? 0,
    open: map.OPEN ?? map.IN_PROGRESS ?? map.ANSWERED ?? 0,
    closed: map.CLOSED ?? map.RESOLVED ?? map.DONE ?? 0,
    raw: map,
  };
}

function mapReportStats(raw: unknown): ReportStatsNormalized {
  const { total, map } = normalizeKeyedStats(raw);
  return {
    total,
    pending: map.PENDING ?? map.OPEN ?? 0,
    resolved: map.RESOLVED ?? map.CLOSED ?? map.DONE ?? 0,
    raw: map,
  };
}

async function fetchPendingCoachCount(): Promise<number> {
  const { data } = await apiClient.get("/user/coach", {
    params: { page: 1, limit: 1, status: "PENDING", order: "desc" },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const pagination = (r.pagination ?? r.meta ?? {}) as Record<string, unknown>;
  if (typeof pagination.total === "number") return pagination.total;

  const list = Array.isArray(r.coach)
    ? r.coach
    : Array.isArray(r.data)
      ? r.data
      : Array.isArray(r.users)
        ? r.users
        : [];
  return list.length;
}

/** تجمیع KPI از endpointهای موجود — بدون پوشه/endpoint جعلی */
export async function fetchAdminOverviewSnapshot(): Promise<AdminOverviewSnapshot> {
  const partialErrors: string[] = [];

  const [
    usersRes,
    coachesRes,
    storesRes,
    productsPendingRes,
    productsApprovedRes,
    productsFeaturedRes,
    ticketsRes,
    reportsRes,
  ] = await Promise.allSettled([
    fetchAdminUsers({ page: 1, limit: 100, order: "desc", status: "ALL" }),
    fetchPendingCoachCount(),
    fetchAdminStores({ page: 1, limit: 50, status: "PENDING" }),
    fetchAdminProducts({ page: 1, limit: 1, status: "PENDING" }),
    fetchAdminProducts({ page: 1, limit: 1, status: "ACTIVE" }),
    fetchAdminProducts({ page: 1, limit: 1, featured: true }),
    fetchTicketStats(),
    fetchReportStats(),
  ]);

  const roleBreakdown = emptyRoles();
  const statusBreakdown = emptyStatus();
  let usersTotal = 0;

  if (usersRes.status === "fulfilled") {
    usersTotal = usersRes.value.pagination.total || usersRes.value.users.length;
    for (const u of usersRes.value.users) {
      if (u.role in roleBreakdown) {
        roleBreakdown[u.role as keyof RoleBreakdown] += 1;
      } else {
        roleBreakdown.other += 1;
      }
      if (u.status in statusBreakdown) {
        statusBreakdown[u.status as keyof StatusBreakdown] += 1;
      } else {
        statusBreakdown.other += 1;
      }
    }
  } else {
    partialErrors.push("users");
  }

  let pendingCoaches = 0;
  if (coachesRes.status === "fulfilled") {
    pendingCoaches = coachesRes.value;
  } else {
    partialErrors.push("coaches");
  }

  let pendingStores = 0;
  if (storesRes.status === "fulfilled") {
    pendingStores =
      storesRes.value.pagination.total ||
      storesRes.value.data.filter((s) => s.status === "PENDING").length;
  } else {
    partialErrors.push("stores");
  }

  const products: ProductStatusBreakdown = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    featured: 0,
    total: 0,
  };

  if (productsPendingRes.status === "fulfilled") {
    products.PENDING = productsPendingRes.value.pagination.total ?? 0;
  } else {
    partialErrors.push("products-pending");
  }

  if (productsApprovedRes.status === "fulfilled") {
    products.APPROVED = productsApprovedRes.value.pagination.total ?? 0;
  } else {
    partialErrors.push("products-approved");
  }

  if (productsFeaturedRes.status === "fulfilled") {
    products.featured = productsFeaturedRes.value.pagination.total ?? 0;
  } else {
    partialErrors.push("products-featured");
  }

  products.total = products.PENDING + products.APPROVED + products.REJECTED;

  let tickets: TicketStatsNormalized = {
    total: 0,
    pending: 0,
    open: 0,
    closed: 0,
    raw: {},
  };
  if (ticketsRes.status === "fulfilled") {
    tickets = mapTicketStats(ticketsRes.value);
  } else {
    partialErrors.push("tickets");
  }

  let reports: ReportStatsNormalized = {
    total: 0,
    pending: 0,
    resolved: 0,
    raw: {},
  };
  if (reportsRes.status === "fulfilled") {
    reports = mapReportStats(reportsRes.value);
  } else {
    partialErrors.push("reports");
  }

  return {
    usersTotal,
    roleBreakdown,
    statusBreakdown,
    pendingCoaches,
    pendingStores,
    products,
    tickets,
    reports,
    fetchedAt: new Date().toISOString(),
    partialErrors,
  };
}
