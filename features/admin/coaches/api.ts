import { apiClient } from "@/lib/api/client";
import { updateAdminUser } from "@/features/admin/users/api";
import type {
  AdminCoachItem,
  AdminCoachesFilters,
  AdminCoachesResponse,
  CoachRequestStatus,
  UpdateCoachByAdminPayload,
  UpdateCoachByAdminResult,
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

function mapItem(raw: unknown): AdminCoachItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const profile = (r.profile ?? {}) as Record<string, unknown>;
  const coachNested = ((r.coach as Record<string, unknown> | undefined) ??
    (r.coachProfile as Record<string, unknown> | undefined) ??
    {}) as Record<string, unknown>;

  const userId = asString(r.id) || asString(r.userId);
  const coachId =
    asString(coachNested.id) ||
    asString(r.coachId) ||
    asString(profile.id) ||
    userId;

  if (!coachId && !userId) return null;

  const id = coachId || userId || "";

  const coachStatus =
    asStatus(coachNested.status) ||
    asStatus(r.coachStatus) ||
    asStatus(r.status);

  const avatar =
    asString(profile.avatar) || asString(r.avatar) || asString(r.avatarUrl);

  const name =
    asString(r.name) ||
    asString(coachNested.title) ||
    asString(coachNested.name) ||
    [asString(profile.firstName), asString(profile.lastName)]
      .filter(Boolean)
      .join(" ") ||
    "—";

  return {
    id,
    coachId: id,
    name,
    email: asString(r.email),
    phone: asString(r.phone),
    role: asString(r.role) || "USER",
    accountStatus: asString(r.status) || "ACTIVE",
    avatarUrl: avatar,
    createdAt: asString(r.createdAt) || asString(coachNested.createdAt) || "",
    coachStatus,
    bio: asString(coachNested.bio) || asString(profile.bio),
    headline: asString(coachNested.headline) || asString(coachNested.title),
    userId,
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

/** GET /user/coach */
export async function fetchAdminCoaches(
  filters: AdminCoachesFilters = {},
): Promise<AdminCoachesResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const { data } = await apiClient.get("/user/coach", {
    params: {
      page,
      limit,
      order: filters.order ?? "desc",
      status:
        filters.status && filters.status !== "ALL" ? filters.status : undefined,
    },
  });

  const root = (data ?? {}) as Record<string, unknown>;
  let items = extractList(root)
    .map(mapItem)
    .filter((x): x is AdminCoachItem => x !== null);

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter((c) => {
      const hay =
        `${c.name} ${c.email ?? ""} ${c.phone ?? ""} ${c.headline ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  const pag = (root.pagination ?? root.meta ?? {}) as Record<string, unknown>;
  const total = num(pag.total) ?? num(pag.totalItems) ?? items.length;
  const totalPages =
    num(pag.totalPages) ??
    num(pag.pageCount) ??
    Math.max(1, Math.ceil(total / limit));
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

/**
 * PATCH /user/coach/{coachId}  body: UpdateCoachByAdminDto
 * + best-effort PUT /user/{userId} { role: COACH | USER }
 */
export async function updateCoachStatusByAdmin(
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

  if (status === "REJECTED" || status === "DELETED") {
    if (!userId) {
      return { roleSynced: false, userId: null };
    }
    try {
      await updateAdminUser(userId, { role: "USER" });
      return { roleSynced: true, userId };
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "بازگردانی نقش به USER ناموفق بود";
      return { roleSynced: false, userId, roleError: msg };
    }
  }

  return { roleSynced: false, userId };
}

/** Alias — برای سازگاری با importهای قدیمی */
export const updateCoachByAdmin = updateCoachStatusByAdmin;
