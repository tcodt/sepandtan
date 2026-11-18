import { apiClient } from "@/lib/api/client";
import type {
  PlanAudienceType,
  SubscriptionPlanAdmin,
  SubscriptionPlanFilters,
  SubscriptionPlanInput,
  SubscriptionPlansResponse,
} from "./types";

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (v && typeof v === "object" && "value" in v) {
    return asString((v as { value: unknown }).value);
  }
  return null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asBool(v: unknown, fallback = false): boolean {
  if (v === true || v === "true" || v === 1) return true;
  if (v === false || v === "false" || v === 0) return false;
  return fallback;
}

function asType(v: unknown): PlanAudienceType | null {
  const s = asString(v)?.toUpperCase();
  if (s === "USER" || s === "COACH" || s === "STORE") return s;
  return null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(asString).filter((x): x is string => Boolean(x));
}

function mapItem(raw: unknown): SubscriptionPlanAdmin | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const slug = asString(r.slug);
  const title = asString(r.title);
  if (!id || !slug || !title) return null;

  return {
    id,
    slug,
    title,
    type: asType(r.type),
    coverImg: asString(r.coverImg),
    description: asString(r.description),
    price: num(r.price) ?? 0,
    originalPrice: num(r.originalPrice),
    durationDays: num(r.durationDays) ?? 30,
    trialDays: num(r.trialDays) ?? 0,
    aiPlanLimitPerMonth: num(r.aiPlanLimitPerMonth),
    aiChatLimitPerDay: num(r.aiChatLimitPerDay),
    canRequestCoach: asBool(r.canRequestCoach, false),
    canTrackProgress: asBool(r.canTrackProgress, true),
    features: asStringArray(r.features),
    isPopular: asBool(r.isPopular, false),
    isActive: asBool(r.isActive, true),
    sortOrder: num(r.sortOrder) ?? 0,
  };
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of ["plans", "plan", "data", "items", "results"]) {
    const v = root[key];
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

function toBody(input: SubscriptionPlanInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    slug: input.slug.trim(),
    title: input.title.trim(),
    price: input.price,
    durationDays: input.durationDays,
    features: input.features ?? [],
    trialDays: input.trialDays ?? 0,
    canRequestCoach: input.canRequestCoach ?? false,
    canTrackProgress: input.canTrackProgress ?? true,
    isPopular: input.isPopular ?? false,
    isActive: input.isActive ?? true,
    sortOrder: input.sortOrder ?? 0,
  };

  if (input.type) body.type = input.type;
  if (input.coverImg) body.coverImg = input.coverImg;
  if (input.description != null) body.description = input.description;
  if (input.originalPrice != null) body.originalPrice = input.originalPrice;
  // null = unlimited
  if (input.aiPlanLimitPerMonth !== undefined) {
    body.aiPlanLimitPerMonth = input.aiPlanLimitPerMonth;
  }
  if (input.aiChatLimitPerDay !== undefined) {
    body.aiChatLimitPerDay = input.aiChatLimitPerDay;
  }

  return body;
}

/** GET /subscription/admin/plan */
export async function fetchAdminSubscriptionPlans(
  filters: SubscriptionPlanFilters = {},
): Promise<SubscriptionPlansResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;

  const { data } = await apiClient.get("/subscription/admin/plan", {
    params: {
      page,
      limit,
      order: filters.order ?? "asc",
    },
  });

  const root = (data ?? {}) as Record<string, unknown>;
  let items = extractList(root)
    .map(mapItem)
    .filter((x): x is SubscriptionPlanAdmin => x !== null);

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (p) =>
        p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    );
  }

  items = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  const pag = (root.pagination ?? root.meta ?? {}) as Record<string, unknown>;
  const total = num(pag.total) ?? items.length;
  const totalPages =
    num(pag.totalPages) || Math.max(1, Math.ceil(total / limit));
  const currentPage = num(pag.page) || page;

  return {
    data: items,
    pagination: {
      page: currentPage,
      limit,
      total,
      totalPages,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
    },
  };
}

/** POST /subscription/admin/plan */
export async function createSubscriptionPlan(
  input: SubscriptionPlanInput,
): Promise<void> {
  if (!input.slug?.trim()) throw new Error("slug الزامی است");
  if (!input.title?.trim()) throw new Error("عنوان الزامی است");
  if (input.price == null) throw new Error("قیمت الزامی است");
  if (input.durationDays == null) throw new Error("مدت الزامی است");
  if (!input.features?.length) throw new Error("حداقل یک ویژگی لازم است");
  await apiClient.post("/subscription/admin/plan", toBody(input));
}

/** PUT /subscription/admin/plan/{id} */
export async function updateSubscriptionPlan(
  id: string,
  input: SubscriptionPlanInput,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.put(
    `/subscription/admin/plan/${encodeURIComponent(id)}`,
    toBody(input),
  );
}

/** DELETE /subscription/admin/plan/{id} */
export async function deleteSubscriptionPlan(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.delete(`/subscription/admin/plan/${encodeURIComponent(id)}`);
}
