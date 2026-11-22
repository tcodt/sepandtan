"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deleteAdminPlanRequest,
  fetchAdminPlanRequests,
  updateAdminPlanRequest,
} from "../api";
import type {
  PlanRequestAdminFilters,
  PlanRequestAdminUpdatePayload,
} from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const planRequestAdminKeys = {
  all: ["admin", "plan-requests"] as const,
  list: (filters: PlanRequestAdminFilters) =>
    [...planRequestAdminKeys.all, "list", filters] as const,
  detail: (id: string) => [...planRequestAdminKeys.all, "detail", id] as const,
};

export function useAdminPlanRequests(filters: PlanRequestAdminFilters = {}) {
  return useQuery({
    queryKey: planRequestAdminKeys.list(filters),
    queryFn: () => fetchAdminPlanRequests(filters),
    placeholderData: (prev) => prev,
    staleTime: 20_000,
  });
}

export function useUpdateAdminPlanRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: PlanRequestAdminUpdatePayload;
    }) => updateAdminPlanRequest(id, payload),
    onSuccess: async () => {
      toast.success("درخواست به‌روزرسانی شد");
      await qc.invalidateQueries({ queryKey: planRequestAdminKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی ناموفق بود"));
    },
  });
}

export function useDeleteAdminPlanRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdminPlanRequest(id),
    onSuccess: async () => {
      toast.success("درخواست حذف شد");
      await qc.invalidateQueries({ queryKey: planRequestAdminKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "حذف ناموفق بود"));
    },
  });
}
