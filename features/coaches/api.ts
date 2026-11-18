import { apiClient } from "@/lib/api/client";
import {
  asArray,
  asNumber,
  asString,
  resolveMediaUrl,
} from "@/features/catalog/utils";
import type {
  CoachDetail,
  CoachListItem,
  CoachRating,
  CoachSpecialty,
  CreateCoachInput,
  MyCoachProfile,
} from "./types";

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return asString(value);
}

function mapRating(raw: unknown): CoachRating | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;
  return {
    id,
    avgCoachRating: asNumber(r.avgCoachRating) ?? 0,
    totalReviews: asNumber(r.totalReviews) ?? 0,
    completedClients: asNumber(r.completedClients) ?? 0,
    activeClients: asNumber(r.activeClients) ?? 0,
    avgPlanRating: asNumber(r.avgPlanRating) ?? 0,
    avgDietRating: asNumber(r.avgDietRating) ?? 0,
  };
}

function mapSpecialty(raw: unknown): CoachSpecialty | null {
  if (typeof raw === "string") {
    return { id: raw, name: raw, slug: null };
  }
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id) ?? asString(r.slug) ?? asString(r.name);
  const name = asString(r.name) ?? asString(r.title);
  if (!id || !name) return null;
  return { id, name, slug: asNullableString(r.slug) };
}

function placeName(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  return asNullableString(r.name) ?? asNullableString(r.title);
}

function extractAvatar(r: Record<string, unknown>): string | null {
  const path =
    asNullableString(r.avatar) ??
    asNullableString(r.avatarUrl) ??
    asNullableString(r.image) ??
    asNullableString(r.cover);
  return path ? resolveMediaUrl(path) || path : null;
}

function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const root = (data ?? {}) as Record<string, unknown>;
  for (const key of ["coaches", "data", "items", "results", "list"]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }
  return asArray(data);
}

export function mapCoachListItem(raw: unknown): CoachListItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const title = asString(r.title) ?? asString(r.name);
  const slug = asString(r.slug) ?? id;
  if (!id || !title) return null;

  const ratingObj = mapRating(r.coachRating);
  const specsRaw = Array.isArray(r.specialties) ? r.specialties : [];
  const specialties = specsRaw
    .map(mapSpecialty)
    .filter((s): s is CoachSpecialty => s !== null)
    .map((s) => s.name);

  return {
    id,
    title,
    slug: slug ?? id,
    headline: asNullableString(r.headline),
    bio: asNullableString(r.bio),
    isAcceptingClients: r.isAcceptingClients !== false,
    rating: ratingObj?.avgCoachRating ?? asNumber(r.rating) ?? 0,
    reviewCount: ratingObj?.totalReviews ?? asNumber(r.reviewCount) ?? 0,
    cityName: placeName(r.city),
    provinceName: placeName(r.province),
    specialties,
    avatarUrl: extractAvatar(r),
  };
}

export function mapCoachDetail(raw: unknown): CoachDetail | null {
  const base = mapCoachListItem(raw);
  if (!base) return null;
  const r = (raw ?? {}) as Record<string, unknown>;

  const specsRaw = Array.isArray(r.specialties) ? r.specialties : [];
  const specialtiesDetailed = specsRaw
    .map(mapSpecialty)
    .filter((s): s is CoachSpecialty => s !== null);

  const workoutPlans = Array.isArray(r.workoutPlans) ? r.workoutPlans : [];
  const dietPlans = Array.isArray(r.dietPlans) ? r.dietPlans : [];

  const workoutPlanIds = workoutPlans
    .map((p) => asString((p as Record<string, unknown>).id))
    .filter((x): x is string => Boolean(x));
  const dietPlanIds = dietPlans
    .map((p) => asString((p as Record<string, unknown>).id))
    .filter((x): x is string => Boolean(x));

  return {
    ...base,
    instagram: asNullableString(r.instagram),
    maxClients: asNumber(r.maxClients) ?? 0,
    specialtiesDetailed,
    coachRating: mapRating(r.coachRating),
    workoutPlanIds,
    dietPlanIds,
    raw: r,
  };
}

function mapMyCoachProfile(raw: unknown): MyCoachProfile | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const title = asString(r.title) ?? asString(r.name);
  const slug = asString(r.slug) ?? id;
  if (!id || !title) return null;
  return {
    id,
    title,
    slug: slug ?? id,
    headline: asNullableString(r.headline),
    bio: asNullableString(r.bio),
    isAcceptingClients: r.isAcceptingClients !== false,
    maxClients: asNumber(r.maxClients) ?? 0,
    instagram: asNullableString(r.instagram),
    raw: r,
  };
}

/** GET /catalog/coach */
export async function fetchPublicCoaches(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<CoachListItem[]> {
  const { data } = await apiClient.get("/catalog/coach", { params });
  return extractList(data)
    .map(mapCoachListItem)
    .filter((c): c is CoachListItem => c !== null);
}

/** GET /catalog/coach/selector */
export async function fetchCoachSelector(): Promise<CoachListItem[]> {
  const { data } = await apiClient.get("/catalog/coach/selector");
  return extractList(data)
    .map(mapCoachListItem)
    .filter((c): c is CoachListItem => c !== null);
}

/** GET /catalog/coach/{slug} */
export async function fetchCoachBySlug(slug: string): Promise<CoachDetail> {
  const { data } = await apiClient.get(
    `/catalog/coach/${encodeURIComponent(slug)}`,
  );
  const mapped = mapCoachDetail(data);
  if (!mapped) throw new Error("مربی پیدا نشد");
  return mapped;
}

/** GET /coach/my */
export async function fetchMyCoachProfile(): Promise<MyCoachProfile | null> {
  try {
    const { data } = await apiClient.get("/coach/my");
    if (!data) return null;
    if (Array.isArray(data)) {
      const first = data[0];
      return first ? mapMyCoachProfile(first) : null;
    }
    const root = data as Record<string, unknown>;
    if (Array.isArray(root.data)) {
      const first = root.data[0];
      return first ? mapMyCoachProfile(first) : null;
    }
    return mapMyCoachProfile(data);
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

/** POST /coach/create */
export async function createCoachProfile(
  input: CreateCoachInput,
): Promise<MyCoachProfile> {
  const { data } = await apiClient.post("/coach/create", input);
  const mapped = mapMyCoachProfile(data);
  if (!mapped) throw new Error("پاسخ ساخت پروفایل مربی نامعتبر است");
  return mapped;
}

/** PUT /coach/update/{coachId} */
export async function updateCoachProfile(
  coachId: string,
  input: Partial<CreateCoachInput>,
): Promise<MyCoachProfile> {
  const { data } = await apiClient.put(
    `/coach/update/${encodeURIComponent(coachId)}`,
    input,
  );
  const mapped = mapMyCoachProfile(data);
  if (!mapped) throw new Error("پاسخ ویرایش پروفایل مربی نامعتبر است");
  return mapped;
}

/** GET /catalog/specialty/{coachId} */
export async function fetchCoachSpecialties(
  coachId: string,
): Promise<CoachSpecialty[]> {
  const { data } = await apiClient.get(
    `/catalog/specialty/${encodeURIComponent(coachId)}`,
  );
  return extractList(data)
    .map(mapSpecialty)
    .filter((s): s is CoachSpecialty => s !== null);
}
