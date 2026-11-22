import { apiClient } from "@/lib/api/client";
import { updateAdminUser } from "@/features/admin/users/api";
import type {
  AdminCoachItem,
  AdminCoachesFilters,
  AdminCoachesResponse,
  CoachRequestStatus,
  UpdateCoachByAdminPayload,
} from "./types";

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (v && typeof v === "object" && "value" in v) {
    return asString((v as { value: unknown }).value);
  }
  return null;
}

function asStatus(v: unknown): CoachRequestStatus | null {
  const s = asString(v)?.toUpperCase();
  if (
    s === "PENDING" ||
    s === "APPROVED" ||
    s === "REJECTED" ||
    s === "SUSPENDED" ||
    s === "DELETED"
  ) {
    return s;
  }
  return null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asBool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === 1 || v === "1") return true;
  if (v === "false" || v === 0 || v === "0") return false;
  return null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(asString).filter((x): x is string => Boolean(x));
}

function pickNested(
  ...sources: Array<Record<string, unknown> | null | undefined>
): Record<string, unknown> {
  for (const s of sources) {
    if (s && typeof s === "object" && Object.keys(s).length > 0) return s;
  }
  return {};
}

/**
 * Maps both shapes:
 * - GET /user/coach → UserProfileResponseDto (+ nested coach)
 * - GET /coach/get/admin → CoachEntity (+ optional user/owner)
 */
function mapItem(raw: unknown): AdminCoachItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;

  const profile = pickNested(
    r.profile as Record<string, unknown>,
    (r.user as Record<string, unknown> | undefined)?.profile as
      | Record<string, unknown>
      | undefined,
  );

  const coachNested = pickNested(
    r.coach as Record<string, unknown>,
    r.coachProfile as Record<string, unknown>,
    // when root itself is coach entity
    r.title || r.slug || r.headline ? r : undefined,
  );

  const userNested = pickNested(
    r.user as Record<string, unknown>,
    r.owner as Record<string, unknown>,
  );

  const userId =
    asString(userNested.id) ||
    asString(r.userId) ||
    asString(coachNested.userId) ||
    // /user/coach list: root id is often the user id
    (asString(r.role) ? asString(r.id) : null);

  const coachId =
    asString(coachNested.id) || asString(r.coachId) || asString(r.id) || userId;

  if (!coachId && !userId) return null;

  const id = coachId || userId || "";

  const cityObj = pickNested(
    coachNested.city as Record<string, unknown>,
    r.city as Record<string, unknown>,
  );
  const provinceObj = pickNested(
    coachNested.province as Record<string, unknown>,
    r.province as Record<string, unknown>,
  );

  const title =
    asString(coachNested.title) ||
    asString(r.title) ||
    asString(r.name) ||
    [asString(profile.firstName), asString(profile.lastName)]
      .filter(Boolean)
      .join(" ") ||
    null;

  const name = asString(r.name) || asString(userNested.name) || title || "—";

  const coachStatus =
    asStatus(coachNested.status) ||
    asStatus(r.coachStatus) ||
    asStatus(r.status);

  const avatar =
    asString(profile.avatar) ||
    asString(r.avatar) ||
    asString(r.avatarUrl) ||
    asString(userNested.avatar) ||
    asStringArray(coachNested.banner)[0] ||
    null;

  return {
    id,
    coachId: id,
    userId,

    name,
    title,
    email:
      asString(r.email) ||
      asString(userNested.email) ||
      asString(profile.email),
    phone:
      asString(r.phone) ||
      asString(userNested.phone) ||
      asString(profile.phone),
    role: asString(r.role) || asString(userNested.role) || "USER",
    accountStatus:
      asString(r.status) || asString(userNested.status) || "ACTIVE",
    avatarUrl: avatar,
    createdAt:
      asString(r.createdAt) ||
      asString(coachNested.createdAt) ||
      asString(userNested.createdAt) ||
      "",

    slug: asString(coachNested.slug) || asString(r.slug),
    headline: asString(coachNested.headline) || asString(r.headline),
    bio: asString(coachNested.bio) || asString(r.bio) || asString(profile.bio),
    instagram: asString(coachNested.instagram) || asString(r.instagram),
    experienceYears:
      asString(coachNested.experienceYears) || asString(r.experienceYears),
    maxClients: num(coachNested.maxClients) ?? num(r.maxClients),
    isAcceptingClients:
      asBool(coachNested.isAcceptingClients) ?? asBool(r.isAcceptingClients),
    commissionRate: num(coachNested.commissionRate) ?? num(r.commissionRate),
    nationalId: asString(coachNested.nationalId) || asString(r.nationalId),
    banners:
      asStringArray(coachNested.banner).length > 0
        ? asStringArray(coachNested.banner)
        : asStringArray(r.banner),
    cityId:
      asString(coachNested.cityId) ||
      asString(r.cityId) ||
      asString(cityObj.id),
    provinceId:
      asString(coachNested.provinceId) ||
      asString(r.provinceId) ||
      asString(provinceObj.id),
    cityName:
      asString(cityObj.name) || asString(cityObj.title) || asString(r.cityName),
    provinceName:
      asString(provinceObj.name) ||
      asString(provinceObj.title) ||
      asString(r.provinceName),

    coachStatus,
    rejectionReason:
      asString(coachNested.rejectionReason) ||
      asString(r.rejectionReason) ||
      null,
  };
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of ["coach", "coaches", "data", "items", "results", "users"]) {
    const v = root[key];
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

/**
 * Primary: GET /coach/get/admin (richer coach fields)
 * Fallback: GET /user/coach (pending applications + user profile)
 */
export async function fetchAdminCoaches(
  filters: AdminCoachesFilters = {},
): Promise<AdminCoachesResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const statusParam =
    filters.status && filters.status !== "ALL" ? filters.status : undefined;

  const params = {
    page,
    limit,
    order: filters.order ?? "desc",
    status: statusParam,
    search: filters.search?.trim() || undefined,
  };

  let root: Record<string, unknown> = {};

  try {
    const { data } = await apiClient.get("/coach/get/admin", { params });
    root = (data ?? {}) as Record<string, unknown>;
    const list = extractList(root);
    if (list.length === 0 && statusParam === "PENDING") {
      // pending applications often live on /user/coach
      const { data: fallback } = await apiClient.get("/user/coach", {
        params: {
          page,
          limit,
          order: params.order,
          status: statusParam,
        },
      });
      root = (fallback ?? {}) as Record<string, unknown>;
    }
  } catch {
    const { data } = await apiClient.get("/user/coach", {
      params: {
        page,
        limit,
        order: params.order,
        status: statusParam,
      },
    });
    root = (data ?? {}) as Record<string, unknown>;
  }

  let items = extractList(root)
    .map(mapItem)
    .filter((x): x is AdminCoachItem => x !== null);

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter((c) => {
      const hay = [
        c.name,
        c.title,
        c.email,
        c.phone,
        c.headline,
        c.bio,
        c.instagram,
        c.slug,
        c.nationalId,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }

  const pag = (root.pagination ?? root.meta ?? {}) as Record<string, unknown>;
  const total = num(pag.total) ?? num(pag.totalItems) ?? items.length;
  const totalPages =
    num(pag.totalPages) ??
    num(pag.pageCount) ??
    Math.max(1, Math.ceil(total / limit) || 1);
  const currentPage = num(pag.page) ?? num(pag.currentPage) ?? page;

  return {
    data: items,
    pagination: {
      page: currentPage,
      limit,
      total,
      totalPages,
      nextPage:
        num(pag.nextPage) ??
        (currentPage < totalPages ? currentPage + 1 : null),
      prevPage: num(pag.prevPage) ?? (currentPage > 1 ? currentPage - 1 : null),
    },
  };
}

export type UpdateCoachByAdminResult = {
  roleSynced: boolean;
  userId: string | null;
  roleError?: string;
};

/**
 * PATCH /user/coach/{coachId}
 * + best-effort role sync via PUT /user/{userId}
 */
export async function updateCoachByAdmin(
  coachId: string,
  payload: UpdateCoachByAdminPayload,
  options?: { userId?: string | null },
): Promise<UpdateCoachByAdminResult> {
  if (!coachId?.trim()) {
    throw new Error("شناسه مربی نامعتبر است");
  }

  const status = payload.status;
  const rejectionReason =
    payload.rejectionReason != null && String(payload.rejectionReason).trim()
      ? String(payload.rejectionReason).trim()
      : null;

  await apiClient.patch(`/user/coach/${encodeURIComponent(coachId)}`, {
    status,
    ...(rejectionReason != null ? { rejectionReason } : {}),
  });

  const userId = options?.userId?.trim() || null;

  if (status === "APPROVED") {
    if (!userId) {
      return {
        roleSynced: false,
        userId: null,
        roleError:
          "وضعیت APPROVED شد ولی userId نبود؛ نقش را از Users روی COACH بگذارید.",
      };
    }
    try {
      await updateAdminUser(userId, { role: "COACH" });
      return { roleSynced: true, userId };
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "به‌روزرسانی نقش COACH ناموفق بود";
      return { roleSynced: false, userId, roleError: msg };
    }
  }

  if (status === "REJECTED" || status === "DELETED" || status === "SUSPENDED") {
    if (!userId) {
      return { roleSynced: false, userId: null };
    }
    try {
      if (status === "REJECTED" || status === "DELETED") {
        await updateAdminUser(userId, { role: "USER" });
        return { roleSynced: true, userId };
      }
      return { roleSynced: false, userId };
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "بازگردانی نقش به USER ناموفق بود";
      return { roleSynced: false, userId, roleError: msg };
    }
  }

  return { roleSynced: false, userId };
}
