import { apiClient } from "@/lib/api/client";
import type {
  AdminUser,
  AdminUsersFilters,
  AdminUsersResponse,
  CreateAdminUserPayload,
  UpdateAdminUserPayload,
} from "./types";
import type { BackendRole, BackendUserStatus } from "@/lib/types/api";

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function asBoolean(v: unknown): boolean {
  return v === true || v === "true" || v === 1;
}

function mapPagination(raw: unknown): AdminUsersResponse["pagination"] {
  const r = (raw ?? {}) as Record<string, unknown>;
  const num = (v: unknown): number | null => {
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const total = num(r.total) ?? num(r.totalItems) ?? num(r.totalCount) ?? 0;
  let next = num(r.nextPage);
  let prev = num(r.prevPage);
  const page = num(r.page) ?? num(r.currentPage);
  const totalPages = num(r.totalPages) ?? num(r.pageCount);

  if (next == null && page != null && totalPages != null && page < totalPages) {
    next = page + 1;
  }
  if (prev == null && page != null && page > 1) {
    prev = page - 1;
  }

  return {
    nextPage: next,
    prevPage: prev,
    total,
  };
}

function mapAdminUser(raw: unknown): AdminUser | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;

  const role = (asString(r.role) ?? "USER") as BackendRole;
  const status = (asString(r.status) ?? "ACTIVE") as BackendUserStatus;

  return {
    id,
    name: asString(r.name) ?? "—",
    email: asString(r.email) ?? "",
    phone: asString(r.phone) ?? "",
    role,
    status,
    isEmailVerified: asBoolean(r.isEmailVerified),
    isPhoneVerified: asBoolean(r.isPhoneVerified),
    createdAt: asString(r.createdAt) ?? "",
    updatedAt: asString(r.updatedAt) ?? "",
  };
}

function normalizeUsersResponse(raw: unknown): AdminUsersResponse {
  const r = (raw ?? {}) as Record<string, unknown>;
  const list = Array.isArray(r.users)
    ? r.users
    : Array.isArray(r.data)
      ? r.data
      : Array.isArray(r.items)
        ? r.items
        : Array.isArray(raw)
          ? raw
          : [];

  const users = list
    .map(mapAdminUser)
    .filter((u): u is AdminUser => u !== null);

  return {
    users,
    pagination: mapPagination(r.pagination ?? r.meta),
  };
}

/** فقط فیلدهای مجاز UpdateUserDto، بدون رشته خالی */
function sanitizeUserPayload(
  payload: UpdateAdminUserPayload,
): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (payload.name != null && String(payload.name).trim()) {
    body.name = String(payload.name).trim();
  }
  if (payload.email != null && String(payload.email).trim()) {
    body.email = String(payload.email).trim();
  }
  if (payload.phone != null && String(payload.phone).trim()) {
    body.phone = String(payload.phone).trim();
  }
  if (payload.password != null && String(payload.password).length > 0) {
    body.password = payload.password;
  }
  if (payload.role) body.role = payload.role;
  if (payload.status) body.status = payload.status;
  return body;
}

/** GET /user */
export async function fetchAdminUsers(
  filters: AdminUsersFilters = {},
): Promise<AdminUsersResponse> {
  const { data } = await apiClient.get("/user", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      order: filters.order ?? "desc",
      search: filters.search || undefined,
      status:
        filters.status && filters.status !== "ALL" ? filters.status : undefined,
      role: filters.role && filters.role !== "ALL" ? filters.role : undefined,
      isEmailVerified: filters.isEmailVerified,
      isPhoneVerified: filters.isPhoneVerified,
    },
  });
  return normalizeUsersResponse(data);
}

/** POST /user */
export async function createAdminUser(
  payload: CreateAdminUserPayload,
): Promise<void> {
  const body = sanitizeUserPayload(payload);
  if (!body.name && !body.phone && !body.email) {
    throw new Error("حداقل نام یا تماس برای ساخت کاربر لازم است");
  }
  await apiClient.post("/user", body);
}

/** PUT /user/{id} — UpdateUserDto */
export async function updateAdminUser(
  id: string,
  payload: UpdateAdminUserPayload,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه کاربر نامعتبر است");
  const body = sanitizeUserPayload(payload);
  if (Object.keys(body).length === 0) {
    throw new Error("هیچ فیلدی برای به‌روزرسانی ارسال نشده");
  }
  await apiClient.put(`/user/${encodeURIComponent(id)}`, body);
}

/** DELETE /user/{id} — حذف حساب (Super Admin) */
export async function deleteAdminUser(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه کاربر نامعتبر است");
  await apiClient.delete(`/user/${encodeURIComponent(id)}`);
}

/**
 * DELETE /user/db/{id}
 * حذف دائم از دیتابیس — فقط Super Admin
 * توضیح swagger: با حذف، کاربر برای همیشه از DB پاک می‌شود
 */
export async function hardDeleteAdminUserFromDb(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه کاربر نامعتبر است");
  await apiClient.delete(`/user/db/${encodeURIComponent(id)}`);
}

/** Soft delete از طریق UpdateUserDto.status = DELETED */
export async function softDeleteAdminUser(id: string): Promise<void> {
  await updateAdminUser(id, { status: "DELETED" });
}
