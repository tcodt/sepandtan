import { apiClient } from "@/lib/api/client";
import { asArray, asNumber, asString } from "@/features/catalog/utils";
import type {
  BackendSubscriptionStatus,
  PaginationMeta,
  SubscribePlanInput,
  SubscriptionDto,
  SubscriptionPlanDto,
  SubscriptionPlanListResponse,
} from "./types";

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return asNumber(value);
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return asString(value);
}

function mapPagination(raw: unknown): PaginationMeta {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    nextPage: asNullableNumber(r.nextPage),
    prevPage: asNullableNumber(r.prevPage),
    total: asNumber(r.total) ?? 0,
  };
}

export function mapSubscriptionPlan(raw: unknown): SubscriptionPlanDto | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const slug = asString(r.slug);
  const title = asString(r.title);
  if (!id || !slug || !title) return null;

  const featuresRaw = Array.isArray(r.features) ? r.features : [];
  const features = featuresRaw
    .map((f) => asString(f))
    .filter((f): f is string => Boolean(f));

  return {
    id,
    slug,
    title,
    description:
      typeof r.description === "string"
        ? r.description
        : asNullableString(r.description),
    price: asNumber(r.price) ?? 0,
    originalPrice: asNullableNumber(r.originalPrice),
    durationDays: asNumber(r.durationDays) ?? 0,
    trialDays: asNumber(r.trialDays) ?? 0,
    aiPlanLimitPerMonth: asNullableNumber(r.aiPlanLimitPerMonth),
    aiChatLimitPerDay: asNullableNumber(r.aiChatLimitPerDay),
    canRequestCoach: Boolean(r.canRequestCoach),
    canTrackProgress: Boolean(r.canTrackProgress),
    features,
    isPopular: Boolean(r.isPopular),
    isActive: r.isActive !== false,
    sortOrder: asNumber(r.sortOrder) ?? 0,
    createdAt: asString(r.createdAt) ?? "",
    updatedAt: asString(r.updatedAt) ?? "",
  };
}

export function mapSubscription(raw: unknown): SubscriptionDto | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const userId = asString(r.userId);
  const planId = asString(r.planId);
  if (!id || !userId || !planId) return null;

  return {
    id,
    userId,
    planId,
    status: (asString(r.status) ?? "PENDING") as BackendSubscriptionStatus,
    pricePaid: asNumber(r.pricePaid) ?? 0,
    startsAt: asNullableString(r.startsAt),
    endsAt: asNullableString(r.endsAt),
    cancelledAt: asNullableString(r.cancelledAt),
    createdAt: asString(r.createdAt) ?? "",
    updatedAt: asString(r.updatedAt) ?? "",
    plan: r.plan ? mapSubscriptionPlan(r.plan) : null,
  };
}

function extractPlanList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const root = (data ?? {}) as Record<string, unknown>;
  if (Array.isArray(root.plans)) return root.plans;
  if (Array.isArray(root.data)) return root.data;
  if (Array.isArray(root.items)) return root.items;
  if (Array.isArray(root.subscriptions)) return root.subscriptions;
  return asArray(data);
}

/** GET /subscription/plan */
export async function fetchSubscriptionPlans(): Promise<SubscriptionPlanListResponse> {
  const { data } = await apiClient.get("/subscription/plan");
  const root = (data ?? {}) as Record<string, unknown>;
  const plans = extractPlanList(data)
    .map(mapSubscriptionPlan)
    .filter((p): p is SubscriptionPlanDto => p !== null)
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    plans,
    pagination: mapPagination(root.pagination),
  };
}

/** GET /subscription/my */
export async function fetchMyActiveSubscription(): Promise<SubscriptionDto | null> {
  try {
    const { data } = await apiClient.get("/subscription/my");
    if (!data) return null;
    return mapSubscription(data);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    throw error;
  }
}

/** GET /subscription/my-detail */
export async function fetchMySubscriptionDetail(): Promise<SubscriptionDto | null> {
  try {
    const { data } = await apiClient.get("/subscription/my-detail");
    if (!data) return null;
    return mapSubscription(data);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    throw error;
  }
}

/** GET /subscription/my-all */
export async function fetchMySubscriptions(): Promise<SubscriptionDto[]> {
  const { data } = await apiClient.get("/subscription/my-all");
  return extractPlanList(data)
    .map(mapSubscription)
    .filter((s): s is SubscriptionDto => s !== null);
}

/** POST /subscription/subscribe */
export async function subscribeToPlan(
  input: SubscribePlanInput,
): Promise<SubscriptionDto> {
  const { data } = await apiClient.post("/subscription/subscribe", {
    planId: input.planId,
  });
  const mapped = mapSubscription(data);
  if (!mapped) {
    throw new Error("پاسخ اشتراک‌گذاری نامعتبر است");
  }
  return mapped;
}

/** PATCH /subscription/my/{id}/cancel */
export async function cancelMySubscription(
  id: string,
): Promise<SubscriptionDto> {
  const { data } = await apiClient.patch(
    `/subscription/my/${encodeURIComponent(id)}/cancel`,
  );
  const mapped = mapSubscription(data);
  if (!mapped) {
    throw new Error("پاسخ لغو اشتراک نامعتبر است");
  }
  return mapped;
}

/** Resolve one plan by id/slug from public list (no dedicated GET by id in swagger) */
export async function fetchSubscriptionPlanById(
  id: string,
): Promise<SubscriptionPlanDto | null> {
  const { plans } = await fetchSubscriptionPlans();
  return plans.find((p) => p.id === id || p.slug === id) ?? null;
}
