import { apiClient } from "@/lib/api/client";
import type {
  AdminStoreItem,
  AdminStoresFilters,
  AdminStoresResponse,
  StoreRequestStatus,
  UpdateStoreByAdminPayload,
} from "./types";

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "value" in value) {
    return asString((value as { value: unknown }).value);
  }
  return null;
}

function mapStoreEntity(raw: unknown): AdminStoreItem {
  const r = (raw ?? {}) as Record<string, unknown>;
  const owner = (r.owner ?? {}) as Record<string, unknown>;

  return {
    id: asString(r.id) || "",
    name: asString(r.name) || asString(owner.name) || "—",
    slug: asString(r.slug),
    email: asString(r.email) || asString(owner.email),
    phone: asString(r.phone) || asString(owner.phone),
    status: (asString(r.status) as StoreRequestStatus) || "PENDING",
    statusReason: asString(r.statusReason),
    isActive: Boolean(r.isActive),
    isVerified: Boolean(r.isVerified),
    businessType: asString(r.businessType),
    ownerName: asString(owner.name),
    ownerId: asString(owner.id),
    createdAt: asString(r.createdAt) ?? undefined,
    source: "store",
  };
}

/** آیتم‌های GET /user/store (درخواست نقش) */
function mapStoreRequest(raw: unknown): AdminStoreItem {
  const r = (raw ?? {}) as Record<string, unknown>;
  const user = (r.user ?? r.owner ?? {}) as Record<string, unknown>;
  const profile = (r.profile ?? {}) as Record<string, unknown>;

  // فقط id فروشگاه/درخواست — هرگز user.id برای PATCH
  const storeId = asString(r.id) || asString(r.storeId) || "";

  const name =
    asString(r.name) ||
    asString(user.name) ||
    [asString(profile.firstName), asString(profile.lastName)]
      .filter(Boolean)
      .join(" ") ||
    "—";

  return {
    id: storeId,
    name,
    slug: asString(r.slug),
    email: asString(r.email) || asString(user.email),
    phone: asString(r.phone) || asString(user.phone),
    status:
      (asString(r.storeStatus) as StoreRequestStatus) ||
      (asString(r.requestStatus) as StoreRequestStatus) ||
      (asString(r.status) as StoreRequestStatus) ||
      "PENDING",
    statusReason: asString(r.statusReason) || asString(r.rejectionReason),
    ownerName: asString(user.name) || name,
    ownerId: asString(user.id) || asString(r.userId),
    createdAt: asString(r.createdAt) ?? undefined,
    source: "request",
  };
}

function normalizePagination(raw: Record<string, unknown>, count: number) {
  return {
    nextPage: (raw.nextPage as number | null) ?? null,
    prevPage: (raw.prevPage as number | null) ?? null,
    total: typeof raw.total === "number" ? raw.total : count,
  };
}

async function fetchStoresAdmin(
  filters: AdminStoresFilters,
): Promise<AdminStoresResponse> {
  const params: Record<string, unknown> = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
    order: filters.order ?? "desc",
    sortBy: "newest",
  };

  if (filters.status && filters.status !== "ALL") {
    params.status = filters.status;
  }
  if (filters.search) params.search = filters.search;

  const { data } = await apiClient.get("/stores/admin", { params });
  const r = (data ?? {}) as Record<string, unknown>;
  const listRaw = (r.stores ?? r.data ?? r.items ?? []) as unknown[];
  const list = (Array.isArray(listRaw) ? listRaw : []).map(mapStoreEntity);
  const paginationRaw = (r.pagination ?? r.meta ?? {}) as Record<
    string,
    unknown
  >;

  return {
    data: list,
    pagination: normalizePagination(paginationRaw, list.length),
  };
}

async function fetchStoreRequests(
  filters: AdminStoresFilters,
): Promise<AdminStoresResponse> {
  const params: Record<string, unknown> = {
    page: filters.page ?? 1,
    limit: filters.limit ?? 20,
    order: filters.order ?? "desc",
  };

  if (filters.status && filters.status !== "ALL") {
    params.status = filters.status;
  }

  const { data } = await apiClient.get("/user/store", { params });
  const r = (data ?? {}) as Record<string, unknown>;
  const listRaw = (r.stores ??
    r.data ??
    r.category ??
    r.users ??
    r.items ??
    []) as unknown[];

  const list = (Array.isArray(listRaw) ? listRaw : [])
    .map(mapStoreRequest)
    .filter((item) => Boolean(item.id)); // بدون id در لیست actionable نیاید

  const paginationRaw = (r.pagination ?? r.meta ?? {}) as Record<
    string,
    unknown
  >;

  return {
    data: list,
    pagination: normalizePagination(paginationRaw, list.length),
  };
}

export async function fetchAdminStores(
  filters: AdminStoresFilters = {},
): Promise<AdminStoresResponse> {
  const [storesResult, requestsResult] = await Promise.allSettled([
    fetchStoresAdmin(filters),
    fetchStoreRequests(filters),
  ]);

  const stores =
    storesResult.status === "fulfilled" ? storesResult.value.data : [];
  const requests =
    requestsResult.status === "fulfilled" ? requestsResult.value.data : [];

  if (
    storesResult.status === "rejected" &&
    requestsResult.status === "rejected"
  ) {
    throw storesResult.reason;
  }

  const map = new Map<string, AdminStoreItem>();
  for (const item of [...requests, ...stores]) {
    if (!item.id) continue;
    if (!map.has(item.id) || item.source === "store") {
      map.set(item.id, item);
    }
  }

  const data = Array.from(map.values());

  const filtered =
    filters.status && filters.status !== "ALL"
      ? data.filter((d) => d.status === filters.status)
      : data;

  const totalFromServer =
    storesResult.status === "fulfilled"
      ? storesResult.value.pagination.total
      : requestsResult.status === "fulfilled"
        ? requestsResult.value.pagination.total
        : filtered.length;

  return {
    data: filtered,
    pagination: {
      nextPage: null,
      prevPage: null,
      total: Math.max(totalFromServer, filtered.length),
    },
  };
}

export async function updateStoreByAdmin(
  storeId: string,
  payload: UpdateStoreByAdminPayload,
  source: "store" | "request" = "request",
): Promise<void> {
  if (!storeId?.trim()) {
    throw new Error("شناسه فروشگاه نامعتبر است — تأیید ممکن نیست");
  }

  if (source === "store") {
    await apiClient.put(`/stores/${storeId}`, {
      status: payload.status,
      statusReason: payload.statusReason ?? null,
      ...(payload.status === "APPROVED"
        ? { isActive: true, isVerified: true }
        : {}),
    });
  } else {
    await apiClient.patch(`/user/store/${storeId}`, {
      status: payload.status,
      statusReason: payload.statusReason ?? null,
    });
  }
}
