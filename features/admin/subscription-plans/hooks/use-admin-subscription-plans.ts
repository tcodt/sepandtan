"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createSubscriptionPlan,
  deleteSubscriptionPlan,
  fetchAdminSubscriptionPlans,
  updateSubscriptionPlan,
} from "../api";
import type { SubscriptionPlanFilters, SubscriptionPlanInput } from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const adminSubscriptionPlanKeys = {
  all: ["admin", "subscription-plans"] as const,
  list: (filters: SubscriptionPlanFilters) =>
    [...adminSubscriptionPlanKeys.all, "list", filters] as const,
};

export function useAdminSubscriptionPlans(
  filters: SubscriptionPlanFilters = {},
) {
  return useQuery({
    queryKey: adminSubscriptionPlanKeys.list(filters),
    queryFn: () => fetchAdminSubscriptionPlans(filters),
    placeholderData: (previous) => previous,
    staleTime: 20_000,
  });
}

export function useCreateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SubscriptionPlanInput) => createSubscriptionPlan(input),
    onSuccess: async () => {
      toast.success("پلن ایجاد شد");
      await queryClient.invalidateQueries({
        queryKey: adminSubscriptionPlanKeys.all,
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ایجاد پلن ناموفق بود"));
    },
  });
}

export function useUpdateSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SubscriptionPlanInput }) =>
      updateSubscriptionPlan(id, input),
    onSuccess: async () => {
      toast.success("پلن به‌روزرسانی شد");
      await queryClient.invalidateQueries({
        queryKey: adminSubscriptionPlanKeys.all,
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی ناموفق بود"));
    },
  });
}

export function useDeleteSubscriptionPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubscriptionPlan(id),
    onSuccess: async () => {
      toast.success("پلن حذف شد");
      await queryClient.invalidateQueries({
        queryKey: adminSubscriptionPlanKeys.all,
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "حذف ناموفق بود"));
    },
  });
}
