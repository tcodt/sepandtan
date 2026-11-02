"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import {
  createColor,
  deleteColor,
  fetchColors,
  fetchColorsAdmin,
  updateColor,
} from "./api";
import type {
  ColorsAdminFilters,
  CreateColorInput,
  UpdateColorInput,
} from "../types";

export const colorKeys = {
  all: ["catalog", "colors"] as const,
  public: () => [...colorKeys.all, "public"] as const,
  admin: (filters: ColorsAdminFilters) =>
    [...colorKeys.all, "admin", filters] as const,
};

export function useColors() {
  return useQuery({
    queryKey: colorKeys.public(),
    queryFn: fetchColors,
    staleTime: 10 * 60 * 1000,
  });
}

export function useColorsAdmin(filters: ColorsAdminFilters) {
  return useQuery({
    queryKey: colorKeys.admin(filters),
    queryFn: () => fetchColorsAdmin(filters),
    placeholderData: (prev) => prev,
  });
}

export function useCreateColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateColorInput) => createColor(payload),
    onSuccess: async () => {
      toast.success("رنگ ایجاد شد");
      await qc.invalidateQueries({ queryKey: colorKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ایجاد رنگ ناموفق بود")),
  });
}

export function useUpdateColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateColorInput }) =>
      updateColor(id, payload),
    onSuccess: async () => {
      toast.success("رنگ به‌روزرسانی شد");
      await qc.invalidateQueries({ queryKey: colorKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ویرایش رنگ ناموفق بود")),
  });
}

export function useDeleteColor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteColor(id),
    onSuccess: async () => {
      toast.success("رنگ حذف شد");
      await qc.invalidateQueries({ queryKey: colorKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف رنگ ناموفق بود")),
  });
}
