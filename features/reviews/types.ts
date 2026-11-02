import type { PaginationMeta } from "@/features/catalog/types";

export type ProductReviewPublic = {
  body: string;
  answerReview: string | null;
  rating: number;
  updatedAt: string;
  user: { id: string; name: string };
};

export type ProductReviewsResponse = {
  pagination: PaginationMeta;
  reviews: ProductReviewPublic[];
};

export type CreateReviewInput = {
  productId: string;
  rating: number; // 1..5
  body: string;
  title?: string;
  orderId?: string;
};

export type AdminReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  answerReview: string | null;
  answerId: string | null;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  verifiedPurchase: boolean;
  variantInfo: string | null;
  userId: string;
  productId: string;
  orderId: string | null;
  product: { id: string; title: string; slug: string };
  user: { id: string; name: string };
};

export type AdminReviewsResponse = {
  pagination: PaginationMeta;
  reviews: AdminReview[];
};

export type AdminReviewsFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  isApproved?: boolean;
  productId?: string;
};

export type StoreProductReviewsFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
};
