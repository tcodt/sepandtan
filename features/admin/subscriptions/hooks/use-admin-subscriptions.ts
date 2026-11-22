"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchAdminSubscriptions, updateAdminSubscriptionStatus } from "../api";
import type {
  AdminSubscriptionFilters,
  AdminSubscriptionStatus,
} from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const subscriptionAdminKeys = {
  all: ["admin", "subscriptions"] as const,
  list: (filters: AdminSubscriptionFilters) =>
    [...subscriptionAdminKeys.all, "list", filters] as const,
};

export function useAdminSubscriptions(filters: AdminSubscriptionFilters = {}) {
  return useQuery({
    queryKey: subscriptionAdminKeys.list(filters),
    queryFn: () => fetchAdminSubscriptions(filters),
    placeholderData: (prev) => prev,
    staleTime: 20_000,
  });
}

export function useUpdateAdminSubscriptionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: AdminSubscriptionStatus;
    }) => updateAdminSubscriptionStatus(id, status),
    onSuccess: async () => {
      toast.success("وضعیت اشتراک به‌روزرسانی شد");
      await qc.invalidateQueries({ queryKey: subscriptionAdminKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "تغییر وضعیت ناموفق بود"));
    },
  });
}
