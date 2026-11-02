"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import {
  answerReview,
  createReview,
  deleteReview,
  fetchAdminReviews,
  fetchProductReviews,
  fetchStoreProductReviews,
  moderateReview,
} from "./api";
import type {
  AdminReviewsFilters,
  CreateReviewInput,
  StoreProductReviewsFilters,
} from "./types";

export const reviewKeys = {
  all: ["reviews"] as const,
  product: (productId: string, page: number) =>
    [...reviewKeys.all, "product", productId, page] as const,
  admin: (filters: AdminReviewsFilters) =>
    [...reviewKeys.all, "admin", filters] as const,
  store: (storeId: string, filters: StoreProductReviewsFilters) =>
    [...reviewKeys.all, "store", storeId, filters] as const,
};

export function useProductReviews(productId: string, page = 1, enabled = true) {
  return useQuery({
    queryKey: reviewKeys.product(productId, page),
    queryFn: () => fetchProductReviews(productId, page),
    enabled: enabled && Boolean(productId),
  });
}

export function useAdminReviews(filters: AdminReviewsFilters = {}) {
  return useQuery({
    queryKey: reviewKeys.admin(filters),
    queryFn: () => fetchAdminReviews(filters),
    placeholderData: (p) => p,
  });
}

export function useStoreProductReviews(
  storeId: string,
  filters: StoreProductReviewsFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: reviewKeys.store(storeId, filters),
    queryFn: () => fetchStoreProductReviews(storeId, filters),
    enabled: enabled && Boolean(storeId),
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReviewInput) => createReview(payload),
    onSuccess: async (_d, vars) => {
      toast.success("نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود");
      await qc.invalidateQueries({
        queryKey: [...reviewKeys.all, "product", vars.productId],
      });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ثبت نظر ناموفق بود")),
  });
}

export function useModerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) =>
      moderateReview(id, isApproved),
    onSuccess: async () => {
      toast.success("وضعیت نظر به‌روز شد");
      await qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (e) =>
      toast.error(getErrorMessage(e, "تغییر وضعیت نظر ناموفق بود")),
  });
}

export function useAnswerReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      answerReview(id, answer),
    onSuccess: async () => {
      toast.success("پاسخ ثبت شد");
      await qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ثبت پاسخ ناموفق بود")),
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: async () => {
      toast.success("نظر حذف شد");
      await qc.invalidateQueries({ queryKey: reviewKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف نظر ناموفق بود")),
  });
}
