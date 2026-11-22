import { apiClient } from "@/lib/api/client";
import type {
  AdminUserPlanFilters,
  AdminUserPlanItem,
  AdminUserPlanListResponse,
  UserPlanStatus,
  UserPlanType,
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
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

const STATUSES: UserPlanStatus[] = [
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
];
const TYPES: UserPlanType[] = ["WORKOUT", "DIET", "ALL"];

function normalizeStatus(raw: unknown): UserPlanStatus {
  const s = asString(raw)?.toUpperCase();
  if (s && STATUSES.includes(s as UserPlanStatus)) return s as UserPlanStatus;
  return "DRAFT";
}

function normalizeType(raw: unknown): UserPlanType {
  const s = asString(raw)?.toUpperCase();
  if (s && TYPES.includes(s as UserPlanType)) return s as UserPlanType;
  return "ALL";
}

function mapItem(raw: unknown): AdminUserPlanItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;

  const user = (r.user ?? {}) as Record<string, unknown>;
  const coach = (r.coach ?? {}) as Record<string, unknown>;

  return {
    id,
    title: asString(r.title) || "بدون عنوان",
    status: normalizeStatus(r.status),
    type: normalizeType(r.type),
    startDate: asString(r.startDate),
    endDate: asString(r.endDate),
    userId: asString(r.userId) ?? asString(user.id),
    userName: asString(user.name) ?? asString(r.userName),
    coachId: asString(r.coachId) ?? asString(coach.id),
    coachName:
      asString(coach.title) ?? asString(coach.name) ?? asString(r.coachName),
    createdAt: asString(r.createdAt),
    updatedAt: asString(r.updatedAt),
  };
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of ["plans", "userPlans", "data", "items", "results"]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

/** GET /user-plan/admin */
export async function fetchAdminUserPlans(
  filters: AdminUserPlanFilters = {},
): Promise<AdminUserPlanListResponse> {
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

  const { data } = await apiClient.get("/user-plan/admin", { params });
  const root = (data ?? {}) as Record<string, unknown>;
  const items = extractList(root)
    .map(mapItem)
    .filter((x): x is AdminUserPlanItem => x !== null);

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

/** DELETE /user-plan/admin/{planId} — فقط موارد اضطراری */
export async function deleteAdminUserPlan(planId: string): Promise<void> {
  if (!planId?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.delete(`/user-plan/admin/${encodeURIComponent(planId)}`);
}
