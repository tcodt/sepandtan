import { apiClient } from "@/lib/api/client";
import {
  asArray,
  asNumber,
  asString,
  mapPagination,
} from "@/features/catalog/utils";
import type {
  AdminStoreReviewFilters,
  CreateStoreReviewInput,
  StoreReviewPublic,
  StoreReviewsPublicResponse,
} from "./types";

function mapStoreReview(raw: unknown): StoreReviewPublic | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;
  const user = (r.user ?? {}) as Record<string, unknown>;
  return {
    id,
    body: asString(r.body),
    rating: asNumber(r.rating) ?? 0,
    productQuality: asNumber(r.productQuality),
    verifiedPurchase: Boolean(r.verifiedPurchase),
    productName: asString(r.productName),
    answerReview: asString(r.answerReview),
    responseAt: asString(r.responseAt),
    createdAt: asString(r.createdAt) ?? "",
    user: {
      id: asString(user.id) ?? undefined,
      name: asString(user.name) ?? "کاربر",
    },
  };
}

/** GET /stores/reviews/{storeId}?page= — Public */
export async function fetchStoreReviewsPublic(
  storeId: string,
  page = 1,
): Promise<StoreReviewsPublicResponse> {
  const { data } = await apiClient.get(`/stores/reviews/${storeId}`, {
    params: { page: String(page) },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.reviews ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    reviews: list
      .map(mapStoreReview)
      .filter((x): x is StoreReviewPublic => x !== null),
  };
}

/** POST /stores/{storeId}/reviews — User */
export async function createStoreReview(
  storeId: string,
  payload: CreateStoreReviewInput,
): Promise<unknown> {
  const { data } = await apiClient.post(`/stores/${storeId}/reviews`, payload);
  return data;
}

/** GET /stores/reviews-admin — Admin */
export async function fetchAdminStoreReviews(
  filters: AdminStoreReviewFilters = {},
): Promise<StoreReviewsPublicResponse> {
  const { data } = await apiClient.get("/stores/reviews-admin", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      order: filters.order ?? "desc",
      status: filters.status,
      storeId: filters.storeId,
      verifiedPurchase:
        typeof filters.verifiedPurchase === "boolean"
          ? filters.verifiedPurchase
          : undefined,
    },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.reviews ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    reviews: list
      .map(mapStoreReview)
      .filter((x): x is StoreReviewPublic => x !== null),
  };
}

export async function approveStoreReview(reviewId: string): Promise<void> {
  await apiClient.put(`/stores/reviews/${reviewId}/approve`);
}

export async function rejectStoreReview(reviewId: string): Promise<void> {
  await apiClient.put(`/stores/reviews/${reviewId}/reject`);
}

export async function answerStoreReview(
  reviewId: string,
  answerReview: string,
): Promise<void> {
  await apiClient.put(`/stores/reviews/${reviewId}/answer`, { answerReview });
}

export async function deleteStoreReview(reviewId: string): Promise<void> {
  await apiClient.delete(`/stores/reviews/${reviewId}`);
}
