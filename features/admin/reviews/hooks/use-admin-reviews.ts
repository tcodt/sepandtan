"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  answerProductReview,
  approveCoachReview,
  deleteCoachReview,
  deleteProductReview,
  fetchAdminCoachReviews,
  fetchAdminProductReviews,
  moderateProductReview,
  updateCoachReviewStatus,
} from "../api";
import type {
  AdminCoachReviewFilters,
  AdminProductReviewFilters,
  CoachReviewStatus,
} from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const reviewsAdminKeys = {
  all: ["admin", "reviews"] as const,
  product: (f: AdminProductReviewFilters) =>
    [...reviewsAdminKeys.all, "product", f] as const,
  coach: (f: AdminCoachReviewFilters) =>
    [...reviewsAdminKeys.all, "coach", f] as const,
};

export function useAdminProductReviews(
  filters: AdminProductReviewFilters = {},
) {
  return useQuery({
    queryKey: reviewsAdminKeys.product(filters),
    queryFn: () => fetchAdminProductReviews(filters),
    placeholderData: (p) => p,
    staleTime: 15_000,
  });
}

export function useAdminCoachReviews(filters: AdminCoachReviewFilters = {}) {
  return useQuery({
    queryKey: reviewsAdminKeys.coach(filters),
    queryFn: () => fetchAdminCoachReviews(filters),
    placeholderData: (p) => p,
    staleTime: 15_000,
  });
}

export function useModerateProductReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) =>
      moderateProductReview(id, isApproved),
    onSuccess: async () => {
      toast.success("وضعیت نظر محصول به‌روزرسانی شد");
      await qc.invalidateQueries({ queryKey: reviewsAdminKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "عملیات ناموفق بود")),
  });
}

export function useAnswerProductReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, answer }: { id: string; answer: string }) =>
      answerProductReview(id, answer),
    onSuccess: async () => {
      toast.success("پاسخ ثبت شد");
      await qc.invalidateQueries({ queryKey: reviewsAdminKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ثبت پاسخ ناموفق بود")),
  });
}

export function useDeleteProductReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProductReview(id),
    onSuccess: async () => {
      toast.success("نظر حذف شد");
      await qc.invalidateQueries({ queryKey: reviewsAdminKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف ناموفق بود")),
  });
}

export function useUpdateCoachReviewStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CoachReviewStatus }) =>
      updateCoachReviewStatus(id, status),
    onSuccess: async () => {
      toast.success("وضعیت نظر مربی به‌روزرسانی شد");
      await qc.invalidateQueries({ queryKey: reviewsAdminKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "عملیات ناموفق بود")),
  });
}

export function useApproveCoachReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, answerReview }: { id: string; answerReview?: string }) =>
      approveCoachReview(id, answerReview ?? ""),
    onSuccess: async () => {
      toast.success("نظر مربی تأیید شد");
      await qc.invalidateQueries({ queryKey: reviewsAdminKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "تأیید ناموفق بود")),
  });
}

export function useDeleteCoachReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCoachReview(id),
    onSuccess: async () => {
      toast.success("نظر مربی حذف شد");
      await qc.invalidateQueries({ queryKey: reviewsAdminKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف ناموفق بود")),
  });
}
