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
  if (s === "APPROVED" || s === "REJECTED" || s === "PENDING") return s;
  return "PENDING";
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
    status: asStatus(r.status),
    statusReason: asString(r.statusReason),
    isActive: Boolean(r.isActive),
    isVerified: Boolean(r.isVerified),
    businessType: asString(r.businessType),
    ownerName: asString(owner.name),
    ownerId: asString(owner.id) || asString(r.userId),
    createdAt: asString(r.createdAt) ?? undefined,
    source: "store",
  };
}

/** آیتم‌های GET /user/store (درخواست نقش) */
function mapStoreRequest(raw: unknown): AdminStoreItem {
  const r = (raw ?? {}) as Record<string, unknown>;
  const user = (r.user ?? r.owner ?? {}) as Record<string, unknown>;
  const profile = (r.profile ?? {}) as Record<string, unknown>;
  const storeNested = (r.store ?? {}) as Record<string, unknown>;

  // فقط id فروشگاه/درخواست — هرگز user.id برای PATCH
  const storeId =
    asString(r.storeId) || asString(storeNested.id) || asString(r.id) || "";

  const ownerId =
    asString(r.userId) ||
    asString(user.id) ||
    asString(ownerIdFallback(r)) ||
    null;

  // اگر id همان userId باشد و storeId جدا نباشد، PATCH اشتباه می‌شود
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

function ownerIdFallback(r: Record<string, unknown>): unknown {
  // بعضی پاسخ‌ها user را داخل profile.user می‌گذارند
  const profile = (r.profile ?? {}) as Record<string, unknown>;
  const nestedUser = (profile.user ?? {}) as Record<string, unknown>;
  return nestedUser.id;
}

function normalizePagination(raw: Record<string, unknown>, count: number) {
  return {
    nextPage: (raw.nextPage as number | null) ?? null,
    prevPage: (raw.prevPage as number | null) ?? null,
    total: typeof raw.total === "number" ? raw.total : count,
  };
}

function extractList(r: Record<string, unknown>): unknown[] {
  const candidates = [
    r.stores,
    r.store,
    r.data,
    r.items,
    r.users,
    r.coach, // PaginatedUserProfileResponseDto گاهی همین کلید را دارد
    r.category,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
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
  const list = extractList(r)
    .map(mapStoreEntity)
    .filter((x) => Boolean(x.id));
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
  const list = extractList(r)
    .map(mapStoreRequest)
    .filter((item) => Boolean(item.id));

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

  // request اولویت دارد برای ownerId؛ store entity برای status نهایی
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
      source: prev?.source === "request" ? "request" : item.source,
    });
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

/**
 * ۱) وضعیت درخواست/فروشگاه
 * ۲) در صورت APPROVED → ارتقای role کاربر به STORE (PUT /user/{ownerId})
 *    چون PATCH فقط status درخواست را عوض می‌کند، نه role.
 */
export async function updateStoreByAdmin(
  storeId: string,
  payload: UpdateStoreByAdminPayload,
  options?: {
    source?: "store" | "request";
    ownerId?: string | null;
  },
): Promise<void> {
  if (!storeId?.trim()) {
    throw new Error("شناسه فروشگاه نامعتبر است — تأیید ممکن نیست");
  }

  const source = options?.source ?? "request";
  const ownerId = options?.ownerId?.trim() || null;

  if (source === "store") {
    await apiClient.put(`/stores/${storeId}`, {
      status: payload.status,
      statusReason: payload.statusReason ?? null,
      ...(payload.status === "APPROVED"
        ? { isActive: true, isVerified: true }
        : {}),
    });
  } else {
    // PATCH /user/store/{storeId} — UpdateStoreByAdminDto
    await apiClient.patch(`/user/store/${storeId}`, {
      status: payload.status,
      statusReason: payload.statusReason ?? null,
    });
  }

  // ارتقای نقش — ضروری برای دیده شدن در admin/users به‌عنوان STORE
  if (payload.status === "APPROVED") {
    if (!ownerId) {
      throw new Error(
        "درخواست فروشگاه تأیید شد ولی شناسه کاربر (ownerId) پیدا نشد؛ نقش به‌صورت STORE ست نشد. از Users نقش را دستی STORE کنید یا پاسخ API لیست را چک کنید.",
      );
    }
    await updateAdminUser(ownerId, { role: "STORE" });
  }

  // رد درخواست معمولاً نقش را برنمی‌گرداند مگر سیاست محصول بگوید USER شود
  // اگر لازم بود:
  // if (payload.status === "REJECTED" && ownerId) {
  //   await updateAdminUser(ownerId, { role: "USER" });
  // }
}
