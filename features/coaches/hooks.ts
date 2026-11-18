"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/api/client";
import {
  createCoachProfile,
  fetchCoachBySlug,
  fetchMyCoachProfile,
  fetchPublicCoaches,
  updateCoachProfile,
} from "./api";
import type { CreateCoachInput } from "./types";

export const coachKeys = {
  all: ["coaches"] as const,
  list: (q?: string) => [...coachKeys.all, "list", q ?? ""] as const,
  detail: (slug: string) => [...coachKeys.all, "detail", slug] as const,
  my: () => [...coachKeys.all, "my"] as const,
};

export function usePublicCoaches(search?: string) {
  return useQuery({
    queryKey: coachKeys.list(search),
    queryFn: () => fetchPublicCoaches({ search, limit: 50 }),
    staleTime: 60_000,
  });
}

export function useCoachDetail(slug: string | null | undefined) {
  return useQuery({
    queryKey: coachKeys.detail(slug ?? ""),
    queryFn: () => fetchCoachBySlug(slug!),
    enabled: Boolean(slug),
    staleTime: 30_000,
  });
}

export function useMyCoachProfile(enabled = true) {
  return useQuery({
    queryKey: coachKeys.my(),
    queryFn: fetchMyCoachProfile,
    enabled,
    staleTime: 20_000,
  });
}

export function useCreateCoachProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCoachInput) => createCoachProfile(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachKeys.all });
      toast.success("پروفایل مربی ساخته شد");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در ساخت پروفایل مربی"));
    },
  });
}

export function useUpdateCoachProfile(coachId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateCoachInput>) =>
      updateCoachProfile(coachId, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: coachKeys.all });
      toast.success("پروفایل مربی به‌روز شد");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در ویرایش پروفایل مربی"));
    },
  });
}
