"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createMuscleGroup,
  deleteMuscleGroup,
  fetchAdminMuscleGroups,
  updateMuscleGroup,
} from "../api";
import type { MuscleGroupFilters, MuscleGroupInput } from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const muscleGroupKeys = {
  all: ["admin", "muscle-group"] as const,
  list: (filters: MuscleGroupFilters) =>
    [...muscleGroupKeys.all, "list", filters] as const,
};

export function useAdminMuscleGroups(filters: MuscleGroupFilters = {}) {
  return useQuery({
    queryKey: muscleGroupKeys.list(filters),
    queryFn: () => fetchAdminMuscleGroups(filters),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

export function useCreateMuscleGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MuscleGroupInput) => createMuscleGroup(input),
    onSuccess: async () => {
      toast.success("گروه عضلانی ایجاد شد");
      await queryClient.invalidateQueries({ queryKey: muscleGroupKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ایجاد ناموفق بود"));
    },
  });
}

export function useUpdateMuscleGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: MuscleGroupInput }) =>
      updateMuscleGroup(id, input),
    onSuccess: async () => {
      toast.success("گروه عضلانی به‌روزرسانی شد");
      await queryClient.invalidateQueries({ queryKey: muscleGroupKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی ناموفق بود"));
    },
  });
}

export function useDeleteMuscleGroup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMuscleGroup(id),
    onSuccess: async () => {
      toast.success("گروه عضلانی حذف شد");
      await queryClient.invalidateQueries({ queryKey: muscleGroupKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "حذف ناموفق بود"));
    },
  });
}
