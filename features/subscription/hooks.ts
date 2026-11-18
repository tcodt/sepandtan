"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/api/client";
import {
  cancelMySubscription,
  fetchMyActiveSubscription,
  fetchMySubscriptionDetail,
  fetchMySubscriptions,
  fetchSubscriptionPlanById,
  fetchSubscriptionPlans,
  subscribeToPlan,
} from "./api";
import type { SubscribePlanInput } from "./types";

export const subscriptionKeys = {
  all: ["subscription"] as const,
  plans: () => [...subscriptionKeys.all, "plans"] as const,
  plan: (id: string) => [...subscriptionKeys.all, "plan", id] as const,
  my: () => [...subscriptionKeys.all, "my"] as const,
  myDetail: () => [...subscriptionKeys.all, "my-detail"] as const,
  myAll: () => [...subscriptionKeys.all, "my-all"] as const,
};

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: subscriptionKeys.plans(),
    queryFn: fetchSubscriptionPlans,
    staleTime: 60_000,
  });
}

export function useSubscriptionPlan(id: string | null | undefined) {
  return useQuery({
    queryKey: subscriptionKeys.plan(id ?? ""),
    queryFn: () => fetchSubscriptionPlanById(id!),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}

export function useMyActiveSubscription(enabled = true) {
  return useQuery({
    queryKey: subscriptionKeys.my(),
    queryFn: fetchMyActiveSubscription,
    enabled,
    staleTime: 15_000,
  });
}

export function useMySubscriptionDetail(enabled = true) {
  return useQuery({
    queryKey: subscriptionKeys.myDetail(),
    queryFn: fetchMySubscriptionDetail,
    enabled,
    staleTime: 15_000,
  });
}

export function useMySubscriptions(enabled = true) {
  return useQuery({
    queryKey: subscriptionKeys.myAll(),
    queryFn: fetchMySubscriptions,
    enabled,
    staleTime: 30_000,
  });
}

export function useSubscribeToPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: SubscribePlanInput) => subscribeToPlan(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: subscriptionKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در ثبت اشتراک"));
    },
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelMySubscription(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: subscriptionKeys.all });
      toast.success("اشتراک لغو شد");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در لغو اشتراک"));
    },
  });
}
