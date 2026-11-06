import type { BackendRole, BackendUserStatus } from "@/lib/types/api";

export type PaginationMeta = {
  nextPage: number | null;
  prevPage: number | null;
  total: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: BackendRole;
  status: BackendUserStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AdminUsersResponse = {
  pagination: PaginationMeta;
  users: AdminUser[];
};

export type AdminUsersFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  search?: string;
  status?: BackendUserStatus | "ALL";
  role?: BackendRole | "ALL";
  isEmailVerified?: boolean;
  isPhoneVerified?: boolean;
};

/** مطابق UpdateUserDto در swagger */
export type UpdateAdminUserPayload = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  role?: BackendRole;
  status?: BackendUserStatus;
};

export type CreateAdminUserPayload = UpdateAdminUserPayload;
