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
  const next =
    typeof r.nextPage === "number"
      ? r.nextPage
      : r.nextPage == null
        ? null
        : Number(r.nextPage);
  const prev =
    typeof r.prevPage === "number"
      ? r.prevPage
      : r.prevPage == null
        ? null
        : Number(r.prevPage);
  const total = typeof r.total === "number" ? r.total : Number(r.total) || 0;
  return {
    nextPage: Number.isFinite(next as number) ? (next as number) : null,
    prevPage: Number.isFinite(prev as number) ? (prev as number) : null,
    total: Number.isFinite(total) ? total : 0,
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
  await apiClient.post("/user", payload);
}

/**
 * PUT /user/{id}
 * swagger: Update All Users by Super Admin — body = UpdateUserDto
 * پاسخ نمونه: { success: true }
 */
export async function updateAdminUser(
  id: string,
  payload: UpdateAdminUserPayload,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه کاربر نامعتبر است");
  await apiClient.put(`/user/${encodeURIComponent(id)}`, payload);
}

/**
 * DELETE /user/{id}
 * swagger: delete user with ID by Super Admin
 * حذف فیزیکی از DB — بدون soft-fallback
 */
export async function deleteAdminUser(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه کاربر نامعتبر است");
  await apiClient.delete(`/user/${encodeURIComponent(id)}`);
}

/** حذف منطقی = فقط status=DELETED (رکورد می‌ماند، لاگین معمولاً بلاک) */
export async function softDeleteAdminUser(id: string): Promise<void> {
  await updateAdminUser(id, { status: "DELETED" });
}
