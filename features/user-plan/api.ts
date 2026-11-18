import { apiClient } from "@/lib/api/client";
import { asArray, asNumber, asString } from "@/features/catalog/utils";
import type {
  ActivateUserPlanInput,
  CurrentUserPlan,
  UserPlanCoachRef,
  UserPlanListItem,
  UserPlanSource,
  UserPlanStatus,
  UserPlanType,
} from "./types";

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return asString(value);
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return asNumber(value);
}

function mapCoach(raw: unknown): UserPlanCoachRef | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = asString(r.id);
  const name = asString(r.name) ?? asString(r.fullName);
  if (!id || !name) return null;
  return {
    id,
    name,
    slug: asNullableString(r.slug),
  };
}

export function mapCurrentUserPlan(raw: unknown): CurrentUserPlan | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const title = asString(r.title);
  if (!id || !title) return null;

  return {
    id,
    title,
    status: (asString(r.status) ?? "DRAFT") as UserPlanStatus,
    type: (asString(r.type) ?? "ALL") as UserPlanType,
    source: (asString(r.source) as UserPlanSource | null) ?? null,
    startDate: asNullableString(r.startDate),
    endDate: asNullableString(r.endDate),
    activatedAt: asNullableString(r.activatedAt),
    coach: mapCoach(r.coach),
    hasWorkout: Boolean(r.hasWorkout),
    hasDiet: Boolean(r.hasDiet),
    currentWeek: asNullableNumber(r.currentWeek),
    isStarted: Boolean(r.isStarted),
    isExpired: Boolean(r.isExpired),
  };
}

export function mapUserPlanListItem(raw: unknown): UserPlanListItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const title = asString(r.title);
  if (!id || !title) return null;

  return {
    id,
    title,
    status: (asString(r.status) ?? "DRAFT") as UserPlanStatus,
    type: (asString(r.type) ?? "ALL") as UserPlanType,
    source: (asString(r.source) as UserPlanSource | null) ?? null,
    startDate: asNullableString(r.startDate),
    endDate: asNullableString(r.endDate),
    activatedAt: asNullableString(r.activatedAt),
    coach: mapCoach(r.coach),
  };
}

function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const root = (data ?? {}) as Record<string, unknown>;
  for (const key of ["plans", "data", "items", "results"]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }
  return asArray(data);
}

/** GET /user-plan/my/current */
export async function fetchCurrentUserPlan(): Promise<CurrentUserPlan | null> {
  const { data } = await apiClient.get("/user-plan/my/current");
  const root = (data ?? {}) as Record<string, unknown>;
  // shape: { plan: CurrentUserPlan | null } or direct entity
  const planRaw = root.plan !== undefined ? root.plan : data;
  if (!planRaw) return null;
  return mapCurrentUserPlan(planRaw);
}

/** GET /user-plan/my */
export async function fetchMyUserPlans(): Promise<UserPlanListItem[]> {
  const { data } = await apiClient.get("/user-plan/my");
  return extractList(data)
    .map(mapUserPlanListItem)
    .filter((p): p is UserPlanListItem => p !== null);
}

/** GET /user-plan/{planId}/workout */
export async function fetchUserPlanWorkout(
  planId: string,
  params?: { week?: number; phaseId?: string },
): Promise<unknown> {
  const { data } = await apiClient.get(
    `/user-plan/${encodeURIComponent(planId)}/workout`,
    { params },
  );
  return data;
}

/** GET /user-plan/{planId}/diet */
export async function fetchUserPlanDiet(
  planId: string,
  params?: { week?: number; phaseId?: string },
): Promise<unknown> {
  const { data } = await apiClient.get(
    `/user-plan/${encodeURIComponent(planId)}/diet`,
    { params },
  );
  return data;
}

/** POST /user-plan/coach/{id}/activate — coach only */
export async function activateUserPlanAsCoach(
  id: string,
  input: ActivateUserPlanInput = {},
): Promise<unknown> {
  const { data } = await apiClient.post(
    `/user-plan/coach/${encodeURIComponent(id)}/activate`,
    input,
  );
  return data;
}

/** PATCH /user-plan/coach/{id}/cancel */
export async function cancelUserPlanAsCoach(id: string): Promise<unknown> {
  const { data } = await apiClient.patch(
    `/user-plan/coach/${encodeURIComponent(id)}/cancel`,
  );
  return data;
}
