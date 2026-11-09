import { apiClient } from "@/lib/api/client";
import {
  asArray,
  asNumber,
  asString,
  mapPagination,
} from "@/features/catalog/utils";
import type {
  AdminReview,
  AdminReviewsFilters,
  AdminReviewsResponse,
  CreateReviewInput,
  ProductReviewPublic,
  ProductReviewsResponse,
  StoreProductReviewsFilters,
} from "./types";

function mapPublicReview(raw: unknown): ProductReviewPublic | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const body = asString(r.body);
  if (!body) return null;
  const user = (r.user ?? {}) as Record<string, unknown>;
  return {
    body,
    answerReview: asString(r.answerReview),
    rating: asNumber(r.rating) ?? 0,
    updatedAt: asString(r.updatedAt) ?? "",
    user: {
      id: asString(user.id) ?? "",
      name: asString(user.name) ?? "کاربر",
    },
  };
}

function mapAdminReview(raw: unknown): AdminReview | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;
  const product = (r.product ?? {}) as Record<string, unknown>;
  const user = (r.user ?? {}) as Record<string, unknown>;
  return {
    id,
    rating: asNumber(r.rating) ?? 0,
    title: asString(r.title),
    body: asString(r.body) ?? "",
    answerReview: asString(r.answerReview),
    answerId: asString(r.answerId),
    isApproved: Boolean(r.isApproved),
    createdAt: asString(r.createdAt) ?? "",
    updatedAt: asString(r.updatedAt) ?? "",
    verifiedPurchase: Boolean(r.verifiedPurchase),
    variantInfo: asString(r.variantInfo),
    userId: asString(r.userId) ?? "",
    productId: asString(r.productId) ?? "",
    orderId: asString(r.orderId),
    product: {
      id: asString(product.id) ?? "",
      title: asString(product.title) ?? "",
      slug: asString(product.slug) ?? "",
    },
    user: {
      id: asString(user.id) ?? "",
      name: asString(user.name) ?? "",
    },
  };
}

/** GET /reviews/product/{productId} — Public */
export async function fetchProductReviews(
  productId: string,
  page = 1,
  limit = 10,
): Promise<ProductReviewsResponse> {
  const { data } = await apiClient.get(
    `/reviews/product/${encodeURIComponent(productId)}`,
    { params: { page, limit } },
  );
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.reviews ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    reviews: list
      .map(mapPublicReview)
      .filter((x): x is ProductReviewPublic => x !== null),
  };
}

/** POST /reviews — User */
export async function createReview(
  payload: CreateReviewInput,
): Promise<unknown> {
  const { data } = await apiClient.post("/reviews", payload);
  return data;
}

/** GET /reviews/admin/all — Admin */
export async function fetchAdminReviews(
  filters: AdminReviewsFilters = {},
): Promise<AdminReviewsResponse> {
  const { data } = await apiClient.get("/reviews/admin/all", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      order: filters.order ?? "desc",
      isApproved:
        typeof filters.isApproved === "boolean"
          ? String(filters.isApproved)
          : undefined,
      productId: filters.productId,
    },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.reviews ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    reviews: list
      .map(mapAdminReview)
      .filter((x): x is AdminReview => x !== null),
  };
}

/**
 * GET /reviews/store/{storeId}
 * نظرات محصولات فروشنده (Store panel — آینده)
 */
export async function fetchStoreProductReviews(
  storeId: string,
  filters: StoreProductReviewsFilters = {},
): Promise<AdminReviewsResponse> {
  const { data } = await apiClient.get(`/reviews/store/${storeId}`, {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      order: filters.order ?? "desc",
    },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.reviews ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    reviews: list
      .map(mapAdminReview)
      .filter((x): x is AdminReview => x !== null),
  };
}

/** PATCH /reviews/{id}/moderate */
export async function moderateReview(
  id: string,
  isApproved: boolean,
): Promise<void> {
  await apiClient.patch(`/reviews/${id}/moderate`, { isApproved });
}

/** POST /reviews/{id}/answer */
export async function answerReview(id: string, answer: string): Promise<void> {
  await apiClient.post(`/reviews/${id}/answer`, { answer });
}

/** DELETE /reviews/{id} — Admin */
export async function deleteReview(id: string): Promise<void> {
  await apiClient.delete(`/reviews/${id}`);
}
