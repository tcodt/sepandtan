import { apiClient } from "@/lib/api/client";
import type {
  AdminCoachReviewFilters,
  AdminCoachReviewItem,
  AdminListResponse,
  AdminProductReviewFilters,
  AdminProductReviewItem,
  CoachReviewStatus,
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

function bool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  if (v === "true" || v === 1) return true;
  if (v === "false" || v === 0) return false;
  return null;
}

const COACH_STATUSES: CoachReviewStatus[] = ["PENDING", "APPROVED", "REJECTED"];

function normalizeCoachStatus(raw: unknown): CoachReviewStatus {
  const s = asString(raw)?.toUpperCase();
  if (s && COACH_STATUSES.includes(s as CoachReviewStatus)) {
    return s as CoachReviewStatus;
  }
  return "PENDING";
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of ["reviews", "review", "data", "items", "results"]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

function paginationOf(
  root: Record<string, unknown>,
  page: number,
  limit: number,
  count: number,
) {
  const pag = (root.pagination ?? root.meta ?? {}) as Record<string, unknown>;
  const total = num(pag.total, count);
  const totalPages =
    num(pag.totalPages, 0) || Math.max(1, Math.ceil(total / limit) || 1);
  return {
    page: num(pag.page, page) || page,
    limit,
    total,
    totalPages,
  };
}

function mapProductReview(raw: unknown): AdminProductReviewItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;

  const user = (r.user ?? r.author ?? {}) as Record<string, unknown>;
  const product = (r.product ?? {}) as Record<string, unknown>;

  return {
    id,
    rating: num(r.rating, 0),
    title: asString(r.title),
    body: asString(r.body) || "",
    answer: asString(r.answerReview) ?? asString(r.answer),
    isApproved: bool(r.isApproved),
    verifiedPurchase: bool(r.verifiedPurchase) === true,
    userId: asString(r.userId) ?? asString(user.id),
    userName: asString(user.name) ?? asString(r.userName),
    productId: asString(r.productId) ?? asString(product.id),
    productName: asString(product.name) ?? asString(r.productName),
    createdAt: asString(r.createdAt),
  };
}

function mapCoachReview(raw: unknown): AdminCoachReviewItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;

  const coach = (r.coach ?? {}) as Record<string, unknown>;
  const author = (r.author ?? r.user ?? {}) as Record<string, unknown>;

  return {
    id,
    status: normalizeCoachStatus(r.status),
    body: asString(r.body),
    coachRating: num(r.coachRating, 0) || null,
    planRating: num(r.planRating, 0) || null,
    dietRating: num(r.dietRating, 0) || null,
    isAnonymous: bool(r.isAnonymous) === true,
    answerReview: asString(r.answerReview),
    coachId: asString(r.coachId) ?? asString(coach.id),
    coachName:
      asString(coach.title) ?? asString(coach.name) ?? asString(r.coachName),
    authorName: asString(author.name) ?? asString(r.authorName),
    createdAt: asString(r.createdAt),
  };
}

/** GET /reviews/admin/all */
export async function fetchAdminProductReviews(
  filters: AdminProductReviewFilters = {},
): Promise<AdminListResponse<AdminProductReviewItem>> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const params: Record<string, string | number | boolean> = {
    page,
    limit,
    order: filters.order ?? "desc",
  };
  if (filters.isApproved === true || filters.isApproved === false) {
    params.isApproved = filters.isApproved;
  }
  if (filters.productId?.trim()) params.productId = filters.productId.trim();

  const { data } = await apiClient.get("/reviews/admin/all", { params });
  const root = (data ?? {}) as Record<string, unknown>;
  const items = extractList(root)
    .map(mapProductReview)
    .filter((x): x is AdminProductReviewItem => x !== null);

  return {
    data: items,
    pagination: paginationOf(root, page, limit, items.length),
  };
}

/** PATCH /reviews/{id}/moderate — ModerateReviewDto */
export async function moderateProductReview(
  id: string,
  isApproved: boolean,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.patch(`/reviews/${encodeURIComponent(id)}/moderate`, {
    isApproved,
  });
}

/** POST /reviews/{id}/answer — AnswerReviewDto */
export async function answerProductReview(
  id: string,
  answer: string,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  if (!answer.trim()) throw new Error("پاسخ الزامی است");
  await apiClient.post(`/reviews/${encodeURIComponent(id)}/answer`, {
    answer: answer.trim(),
  });
}

/** DELETE /reviews/{id} */
export async function deleteProductReview(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.delete(`/reviews/${encodeURIComponent(id)}`);
}

/** GET /coach/review/admin */
export async function fetchAdminCoachReviews(
  filters: AdminCoachReviewFilters = {},
): Promise<AdminListResponse<AdminCoachReviewItem>> {
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
  if (filters.coachId?.trim()) params.coachId = filters.coachId.trim();

  const { data } = await apiClient.get("/coach/review/admin", { params });
  const root = (data ?? {}) as Record<string, unknown>;
  const items = extractList(root)
    .map(mapCoachReview)
    .filter((x): x is AdminCoachReviewItem => x !== null);

  return {
    data: items,
    pagination: paginationOf(root, page, limit, items.length),
  };
}

/** PATCH /coach/review/status/{id} — UpdateCoachReviewDto */
export async function updateCoachReviewStatus(
  id: string,
  status: CoachReviewStatus,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.patch(`/coach/review/status/${encodeURIComponent(id)}`, {
    status,
  });
}

/** PUT /coach/review/approve/{id} — ApprovedCoachReviewDto */
export async function approveCoachReview(
  id: string,
  answerReview = "",
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.put(`/coach/review/approve/${encodeURIComponent(id)}`, {
    answerReview,
  });
}

/** DELETE /coach/review/{id} */
export async function deleteCoachReview(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.delete(`/coach/review/${encodeURIComponent(id)}`);
}
