import type { PaginationMeta } from "@/features/catalog/types";

export type StoreReviewPublic = {
  id: string;
  body: string | null;
  rating: number;
  productQuality: number | null;
  verifiedPurchase: boolean;
  productName: string | null;
  answerReview: string | null;
  responseAt: string | null;
  createdAt: string;
  user: { id?: string; name: string };
};

export type StoreReviewsPublicResponse = {
  pagination: PaginationMeta;
  reviews: StoreReviewPublic[];
};

export type CreateStoreReviewInput = {
  rating: number;
  body?: string;
  productQuality?: number;
};

export type AdminStoreReviewFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  status?: "PENDING" | "APPROVED" | "REJECTED" | "All";
  storeId?: string;
  verifiedPurchase?: boolean;
};
