import { apiClient } from "@/lib/api/client";
import type {
  AdminUser,
  AdminUsersFilters,
  AdminUsersResponse,
  UpdateAdminUserPayload,
} from "./types";

function normalizeUsersResponse(raw: unknown): AdminUsersResponse {
  const r = (raw ?? {}) as Record<string, unknown>;
  const users = (r.users ?? r.data ?? r.items ?? []) as AdminUser[];
  const paginationRaw = (r.pagination ?? r.meta ?? {}) as Record<
    string,
    unknown
  >;

  return {
    users: Array.isArray(users) ? users : [],
    pagination: {
      nextPage: (paginationRaw.nextPage as number | null) ?? null,
      prevPage: (paginationRaw.prevPage as number | null) ?? null,
      total:
        typeof paginationRaw.total === "number"
          ? paginationRaw.total
          : users.length,
    },
  };
}

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

export async function createAdminUser(
  payload: UpdateAdminUserPayload,
): Promise<AdminUser> {
  const { data } = await apiClient.post<AdminUser>("/user", payload);
  return data;
}

/**
 * آپدیت کاربر
 * بعضی بک‌اندها PUT /user/{id} می‌خواهند، بعضی PUT /user با id در body
 */
export async function updateAdminUser(
  id: string,
  payload: UpdateAdminUserPayload,
): Promise<AdminUser> {
  try {
    const { data } = await apiClient.put<AdminUser>(`/user/${id}`, payload);
    return data;
  } catch (err: unknown) {
    // fallback: بعضی نسخه‌ها id را داخل body می‌خواهند
    const status =
      typeof err === "object" &&
      err !== null &&
      "response" in err &&
      typeof (err as { response?: { status?: number } }).response?.status ===
        "number"
        ? (err as { response: { status: number } }).response.status
        : null;

    if (status === 404 || status === 400 || status === 405) {
      const { data } = await apiClient.put<AdminUser>("/user", {
        id,
        ...payload,
      });
      return data as AdminUser;
    }

    throw err;
  }
}

export async function deleteAdminUser(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه کاربر نامعتبر است");

  // حذف سمت سرور (طبق swagger: Super Admin)
  await apiClient.delete(`/user/${id}`);
}

export async function softDeleteAdminUser(id: string): Promise<AdminUser> {
  return updateAdminUser(id, {
    status: "DELETED",
    role: "USER",
  });
}
