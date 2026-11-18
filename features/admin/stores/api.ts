import { apiClient } from "@/lib/api/client";
import { updateAdminUser } from "@/features/admin/users/api";
import type {
  AdminStoreItem,
  AdminStoresFilters,
  AdminStoresResponse,
  UpdateStoreByAdminPayload,
  StoreRequestStatus,
} from "./types";

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "value" in value) {
    return asString((value as { value: unknown }).value);
  }
  return null;
}

function asStatus(value: unknown): StoreRequestStatus {
  const s = asString(value)?.toUpperCase();
  if (
    s === "APPROVED" ||
    s === "REJECTED" ||
    s === "PENDING" ||
    s === "SUSPENDED" ||
    s === "DELETED"
  ) {
    return s;
  }
  return "PENDING";
}

function mapStoreEntity(raw: unknown): AdminStoreItem {
  const r = (raw ?? {}) as Record<string, unknown>;
  const owner = (r.owner ?? r.user ?? {}) as Record<string, unknown>;

  return {
    id: asString(r.id) || "",
    name: asString(r.name) || asString(owner.name) || "—",
    slug: asString(r.slug),
    email: asString(r.email) || asString(owner.email),
    phone: asString(r.phone) || asString(owner.phone),
    status: asStatus(r.status),
    statusReason: asString(r.statusReason) || asString(r.rejectionReason),
    isActive: Boolean(r.isActive),
    isVerified: Boolean(r.isVerified),
    businessType: asString(r.businessType),
    ownerName: asString(owner.name),
    ownerId: asString(owner.id) || asString(r.userId) || asString(r.ownerId),
    createdAt: asString(r.createdAt) ?? undefined,
    source: "store",
  };
}

function mapStoreRequest(raw: unknown): AdminStoreItem {
  const r = (raw ?? {}) as Record<string, unknown>;
  const user = (r.user ?? r.owner ?? {}) as Record<string, unknown>;
  const profile = (r.profile ?? {}) as Record<string, unknown>;
  const storeNested = (r.store ?? {}) as Record<string, unknown>;

  const storeId =
    asString(r.storeId) || asString(storeNested.id) || asString(r.id) || "";

  const ownerId =
    asString(r.userId) ||
    asString(user.id) ||
    asString(
      ((profile.user as Record<string, unknown> | undefined) ?? {}).id,
    ) ||
    null;

  const safeStoreId =
    storeId && ownerId && storeId === ownerId
      ? asString(storeNested.id) || storeId
      : storeId;

  const name =
    asString(r.name) ||
    asString(storeNested.name) ||
    asString(user.name) ||
    [asString(profile.firstName), asString(profile.lastName)]
      .filter(Boolean)
      .join(" ") ||
    "—";

  return {
    id: safeStoreId,
    name,
    slug: asString(r.slug) || asString(storeNested.slug),
    email: asString(r.email) || asString(user.email),
    phone: asString(r.phone) || asString(user.phone),
    status: asStatus(
      r.storeStatus ?? r.requestStatus ?? r.status ?? storeNested.status,
    ),
    statusReason:
      asString(r.statusReason) ||
      asString(r.rejectionReason) ||
      asString(storeNested.statusReason),
    ownerName: asString(user.name) || name,
    ownerId,
    createdAt: asString(r.createdAt) ?? undefined,
    source: "request",
  };
}

function normalizePagination(raw: Record<string, unknown>, count: number) {
  const num = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  return {
    nextPage: num(raw.nextPage),
    prevPage: num(raw.prevPage),
    total: num(raw.total) ?? num(raw.totalItems) ?? count,
  };
}

function extractList(r: Record<string, unknown>): unknown[] {
  for (const key of ["stores", "store", "data", "items", "results"]) {
    const v = r[key];
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(r) ? (r as unknown[]) : [];
}

async function fetchStoresAdmin(
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
  if (filters.search?.trim()) params.search = filters.search.trim();

  const { data } = await apiClient.get("/stores/admin", { params });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = extractList(r)
    .map(mapStoreEntity)
    .filter((x) => Boolean(x.id));

  return {
    data: list,
    pagination: normalizePagination(
      (r.pagination ?? r.meta ?? {}) as Record<string, unknown>,
      list.length,
    ),
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
  const list = extractList(r)
    .map(mapStoreRequest)
    .filter((item) => Boolean(item.id));

  return {
    data: list,
    pagination: normalizePagination(
      (r.pagination ?? r.meta ?? {}) as Record<string, unknown>,
      list.length,
    ),
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

  for (const item of requests) {
    if (!item.id) continue;
    map.set(item.id, item);
  }
  for (const item of stores) {
    if (!item.id) continue;
    const prev = map.get(item.id);
    map.set(item.id, {
      ...item,
      ownerId: item.ownerId || prev?.ownerId || null,
      ownerName: item.ownerName || prev?.ownerName || null,
      statusReason: item.statusReason || prev?.statusReason || null,
      source: prev?.source === "request" ? "request" : item.source,
    });
  }

  let data = Array.from(map.values());

  if (filters.status && filters.status !== "ALL") {
    data = data.filter((d) => d.status === filters.status);
  }

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    data = data.filter((d) => {
      const hay =
        `${d.name} ${d.slug ?? ""} ${d.email ?? ""} ${d.phone ?? ""} ${d.ownerName ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const totalFromServer =
    storesResult.status === "fulfilled"
      ? storesResult.value.pagination.total
      : requestsResult.status === "fulfilled"
        ? requestsResult.value.pagination.total
        : data.length;

  return {
    data,
    pagination: {
      nextPage: null,
      prevPage: null,
      total: Math.max(totalFromServer, data.length),
    },
  };
}

export type UpdateStoreByAdminResult = {
  roleSynced: boolean;
  ownerId: string | null;
  roleError?: string;
};

/**
 * request → PATCH /user/store/{storeId}  { status, statusReason? }
 * store   → PUT   /stores/{id}           { status }
 * role    → PUT   /user/{ownerId}        { role }  best-effort
 */
export async function updateStoreByAdmin(
  storeId: string,
  payload: UpdateStoreByAdminPayload,
  options?: {
    source?: "store" | "request";
    ownerId?: string | null;
  },
): Promise<UpdateStoreByAdminResult> {
  if (!storeId?.trim()) {
    throw new Error("شناسه فروشگاه نامعتبر است");
  }

  const source = options?.source ?? "request";
  const ownerId = options?.ownerId?.trim() || null;
  const status = payload.status;
  const statusReason =
    payload.statusReason != null && String(payload.statusReason).trim()
      ? String(payload.statusReason).trim()
      : null;

  if (source === "store") {
    await apiClient.put(`/stores/${encodeURIComponent(storeId)}`, { status });
  } else {
    await apiClient.patch(`/user/store/${encodeURIComponent(storeId)}`, {
      status,
      ...(statusReason != null ? { statusReason } : {}),
    });
  }

  if (status === "APPROVED") {
    if (!ownerId) {
      return {
        roleSynced: false,
        ownerId: null,
        roleError:
          "وضعیت APPROVED شد ولی ownerId نبود؛ نقش را از Users روی STORE بگذارید.",
      };
    }
    try {
      await updateAdminUser(ownerId, { role: "STORE" });
      return { roleSynced: true, ownerId };
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "به‌روزرسانی نقش STORE ناموفق بود";
      return { roleSynced: false, ownerId, roleError: msg };
    }
  }

  if (status === "REJECTED") {
    if (!ownerId) {
      return { roleSynced: false, ownerId: null };
    }
    try {
      await updateAdminUser(ownerId, { role: "USER" });
      return { roleSynced: true, ownerId };
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "بازگردانی نقش به USER ناموفق بود";
      return { roleSynced: false, ownerId, roleError: msg };
    }
  }

  return { roleSynced: false, ownerId };
}
