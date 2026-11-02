"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import {
  createReport,
  deleteReport,
  fetchAdminReports,
  fetchReportById,
  fetchReportStats,
  updateReportStatus,
} from "./api";
import type { CreateReportInput } from "./types";

export const reportKeys = {
  all: ["reports"] as const,
  admin: (params?: Record<string, unknown>) =>
    [...reportKeys.all, "admin", params] as const,
  detail: (id: string) => [...reportKeys.all, "detail", id] as const,
  stats: () => [...reportKeys.all, "stats"] as const,
};

export function useCreateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReportInput) => createReport(payload),
    onSuccess: async () => {
      toast.success("گزارش ثبت شد");
      await qc.invalidateQueries({ queryKey: reportKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ثبت گزارش ناموفق بود")),
  });
}

export function useAdminReports(
  params?: Record<string, unknown>,
  enabled = true,
) {
  return useQuery({
    queryKey: reportKeys.admin(params),
    queryFn: () => fetchAdminReports(params),
    enabled,
  });
}

export function useReportDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: reportKeys.detail(id),
    queryFn: () => fetchReportById(id),
    enabled: enabled && Boolean(id),
  });
}

export function useReportStats(enabled = true) {
  return useQuery({
    queryKey: reportKeys.stats(),
    queryFn: fetchReportStats,
    enabled,
  });
}

export function useUpdateReportStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      updateReportStatus(id, status),
    onSuccess: async () => {
      toast.success("وضعیت گزارش به‌روز شد");
      await qc.invalidateQueries({ queryKey: reportKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteReport(id),
    onSuccess: async () => {
      toast.success("گزارش حذف شد");
      await qc.invalidateQueries({ queryKey: reportKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
