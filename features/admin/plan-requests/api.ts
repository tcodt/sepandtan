import { apiClient } from "@/lib/api/client";
import type {
  PlanRequestAdminFilters,
  PlanRequestAdminItem,
  PlanRequestAdminListResponse,
  PlanRequestAdminUpdatePayload,
  PlanRequestStatus,
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

const STATUSES: PlanRequestStatus[] = [
  "PENDING",
  "ACCEPTED",
  "PAID",
  "DELIVERED",
  "REJECTED",
  "CANCELLED",
];

function normalizeStatus(raw: unknown): PlanRequestStatus {
  const s = asString(raw)?.toUpperCase();
  if (s && STATUSES.includes(s as PlanRequestStatus)) {
    return s as PlanRequestStatus;
  }
  return "PENDING";
}

function mapItem(raw: unknown): PlanRequestAdminItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;

  const user = (r.user ?? r.trainee ?? {}) as Record<string, unknown>;
  const coach = (r.coach ?? {}) as Record<string, unknown>;
  const profile = (user.profile ?? {}) as Record<string, unknown>;

  return {
    id,
    status: normalizeStatus(r.status),
    note: asString(r.note),
    rejectionReason: asString(r.rejectionReason) ?? asString(r.reason),
    coachId: asString(r.coachId) ?? asString(coach.id),
    coachName:
      asString(coach.title) ?? asString(coach.name) ?? asString(coach.headline),
    userId: asString(r.userId) ?? asString(user.id),
    userName:
      asString(user.name) ?? asString(profile.name) ?? asString(user.fullName),
    userPhone: asString(user.phone) ?? asString(profile.phone),
    workoutTemplateId: asString(r.workoutTemplateId),
    dietTemplateId: asString(r.dietTemplateId),
    createdAt: asString(r.createdAt),
    updatedAt: asString(r.updatedAt),
  };
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of [
    "planRequests",
    "planRequest",
    "requests",
    "data",
    "items",
    "results",
  ]) {
    const v = root[key];
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

/** GET /plan-request/admin */
export async function fetchAdminPlanRequests(
  filters: PlanRequestAdminFilters = {},
): Promise<PlanRequestAdminListResponse> {
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
  if (filters.coachId?.trim()) {
    params.coachId = filters.coachId.trim();
  }

  const { data } = await apiClient.get("/plan-request/admin", { params });
  const root = (data ?? {}) as Record<string, unknown>;
  const items = extractList(root)
    .map(mapItem)
    .filter((x): x is PlanRequestAdminItem => x !== null);

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

/** GET /plan-request/admin/{id} */
export async function fetchAdminPlanRequestById(
  id: string,
): Promise<PlanRequestAdminItem> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  const { data } = await apiClient.get(
    `/plan-request/admin/${encodeURIComponent(id)}`,
  );
  const item = mapItem(data);
  if (!item) throw new Error("درخواست یافت نشد");
  return item;
}

/** PUT /plan-request/admin/{id} — PlanRequestAdminDto */
export async function updateAdminPlanRequest(
  id: string,
  payload: PlanRequestAdminUpdatePayload,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  const body: Record<string, unknown> = {};
  if (payload.status) body.status = payload.status;
  if (payload.dietTemplateId !== undefined) {
    body.dietTemplateId = payload.dietTemplateId || null;
  }
  if (payload.note !== undefined) body.note = payload.note;
  if (payload.rejectionReason !== undefined) {
    body.rejectionReason = payload.rejectionReason;
  }
  await apiClient.put(`/plan-request/admin/${encodeURIComponent(id)}`, body);
}

/** DELETE /plan-request/admin/{requestId} */
export async function deleteAdminPlanRequest(requestId: string): Promise<void> {
  if (!requestId?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.delete(
    `/plan-request/admin/${encodeURIComponent(requestId)}`,
  );
}
