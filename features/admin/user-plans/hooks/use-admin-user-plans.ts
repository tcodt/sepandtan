"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { deleteAdminUserPlan, fetchAdminUserPlans } from "../api";
import type { AdminUserPlanFilters } from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const userPlanAdminKeys = {
  all: ["admin", "user-plans"] as const,
  list: (filters: AdminUserPlanFilters) =>
    [...userPlanAdminKeys.all, "list", filters] as const,
};

export function useAdminUserPlans(filters: AdminUserPlanFilters = {}) {
  return useQuery({
    queryKey: userPlanAdminKeys.list(filters),
    queryFn: () => fetchAdminUserPlans(filters),
    placeholderData: (prev) => prev,
    staleTime: 20_000,
  });
}

export function useDeleteAdminUserPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => deleteAdminUserPlan(planId),
    onSuccess: async () => {
      toast.success("برنامه حذف شد");
      await qc.invalidateQueries({ queryKey: userPlanAdminKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "حذف برنامه ناموفق بود"));
    },
  });
}
