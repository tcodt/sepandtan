"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createSpecialty,
  deleteSpecialty,
  fetchAdminSpecialties,
  updateSpecialty,
} from "../api";
import type { SpecialtyFilters, SpecialtyInput } from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const specialtyKeys = {
  all: ["admin", "specialty"] as const,
  list: (filters: SpecialtyFilters) =>
    [...specialtyKeys.all, "list", filters] as const,
};

export function useAdminSpecialties(filters: SpecialtyFilters = {}) {
  return useQuery({
    queryKey: specialtyKeys.list(filters),
    queryFn: () => fetchAdminSpecialties(filters),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

export function useCreateSpecialty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SpecialtyInput) => createSpecialty(input),
    onSuccess: async () => {
      toast.success("تخصص ایجاد شد");
      await queryClient.invalidateQueries({ queryKey: specialtyKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ایجاد تخصص ناموفق بود"));
    },
  });
}

export function useUpdateSpecialty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: SpecialtyInput }) =>
      updateSpecialty(id, input),
    onSuccess: async () => {
      toast.success("تخصص به‌روزرسانی شد");
      await queryClient.invalidateQueries({ queryKey: specialtyKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی ناموفق بود"));
    },
  });
}

export function useDeleteSpecialty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSpecialty(id),
    onSuccess: async () => {
      toast.success("تخصص حذف شد");
      await queryClient.invalidateQueries({ queryKey: specialtyKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "حذف ناموفق بود"));
    },
  });
}
