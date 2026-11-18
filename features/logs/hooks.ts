"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/api/client";
import {
  createUserLog,
  deleteUserLog,
  fetchDashboardLogs,
  fetchLogByDate,
  fetchMyLogs,
  fetchWeeklyStats,
  updateUserLog,
} from "./api";
import type { CreateUserLogInput, UpdateUserLogInput } from "./types";

export const logKeys = {
  all: ["logs"] as const,
  list: () => [...logKeys.all, "list"] as const,
  byDate: (date: string) => [...logKeys.all, "date", date] as const,
  dashboard: () => [...logKeys.all, "dashboard"] as const,
  weekly: (from?: string, to?: string) =>
    [...logKeys.all, "weekly", from ?? "", to ?? ""] as const,
};

export function useMyLogs(enabled = true) {
  return useQuery({
    queryKey: logKeys.list(),
    queryFn: () => fetchMyLogs(),
    enabled,
    staleTime: 20_000,
  });
}

export function useLogByDate(date: string | null | undefined) {
  return useQuery({
    queryKey: logKeys.byDate(date ?? ""),
    queryFn: () => fetchLogByDate(date!),
    enabled: Boolean(date),
    staleTime: 15_000,
  });
}

export function useDashboardLogs(enabled = true) {
  return useQuery({
    queryKey: logKeys.dashboard(),
    queryFn: fetchDashboardLogs,
    enabled,
    staleTime: 20_000,
  });
}

export function useWeeklyLogStats(from?: string, to?: string) {
  return useQuery({
    queryKey: logKeys.weekly(from, to),
    queryFn: () => fetchWeeklyStats({ from, to }),
    staleTime: 60_000,
  });
}

export function useCreateUserLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserLogInput) => createUserLog(input),
    onSuccess: (log) => {
      void qc.invalidateQueries({ queryKey: logKeys.all });
      void qc.invalidateQueries({ queryKey: logKeys.byDate(log.date) });
      toast.success("لاگ روز ثبت شد");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در ثبت لاگ"));
    },
  });
}

export function useUpdateUserLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateUserLogInput }) =>
      updateUserLog(id, input),
    onSuccess: (log) => {
      void qc.invalidateQueries({ queryKey: logKeys.all });
      void qc.invalidateQueries({ queryKey: logKeys.byDate(log.date) });
      toast.success("لاگ به‌روز شد");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در ویرایش لاگ"));
    },
  });
}

export function useDeleteUserLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUserLog(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: logKeys.all });
      toast.success("لاگ حذف شد");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در حذف لاگ"));
    },
  });
}
