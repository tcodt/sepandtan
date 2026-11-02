"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import {
  answerStoreReview,
  approveStoreReview,
  createStoreReview,
  deleteStoreReview,
  fetchAdminStoreReviews,
  fetchStoreReviewsPublic,
  rejectStoreReview,
} from "./api";
import type { AdminStoreReviewFilters, CreateStoreReviewInput } from "./types";

export const storeReviewKeys = {
  all: ["store-reviews"] as const,
  public: (storeId: string, page: number) =>
    [...storeReviewKeys.all, "public", storeId, page] as const,
  admin: (filters: AdminStoreReviewFilters) =>
    [...storeReviewKeys.all, "admin", filters] as const,
};

export function useStoreReviewsPublic(
  storeId: string,
  page = 1,
  enabled = true,
) {
  return useQuery({
    queryKey: storeReviewKeys.public(storeId, page),
    queryFn: () => fetchStoreReviewsPublic(storeId, page),
    enabled: enabled && Boolean(storeId),
  });
}

export function useAdminStoreReviews(filters: AdminStoreReviewFilters = {}) {
  return useQuery({
    queryKey: storeReviewKeys.admin(filters),
    queryFn: () => fetchAdminStoreReviews(filters),
    placeholderData: (p) => p,
  });
}

export function useCreateStoreReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      storeId,
      payload,
    }: {
      storeId: string;
      payload: CreateStoreReviewInput;
    }) => createStoreReview(storeId, payload),
    onSuccess: async () => {
      toast.success("نظر فروشگاه ثبت شد");
      await qc.invalidateQueries({ queryKey: storeReviewKeys.all });
    },
    onError: (e) =>
      toast.error(getErrorMessage(e, "ثبت نظر فروشگاه ناموفق بود")),
  });
}

export function useApproveStoreReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveStoreReview(id),
    onSuccess: async () => {
      toast.success("نظر تأیید شد");
      await qc.invalidateQueries({ queryKey: storeReviewKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useRejectStoreReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rejectStoreReview(id),
    onSuccess: async () => {
      toast.success("نظر رد شد");
      await qc.invalidateQueries({ queryKey: storeReviewKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useAnswerStoreReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reviewId,
      answerReview,
    }: {
      reviewId: string;
      answerReview: string;
    }) => answerStoreReview(reviewId, answerReview),
    onSuccess: async () => {
      toast.success("پاسخ ثبت شد");
      await qc.invalidateQueries({ queryKey: storeReviewKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteStoreReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStoreReview(id),
    onSuccess: async () => {
      toast.success("نظر حذف شد");
      await qc.invalidateQueries({ queryKey: storeReviewKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
