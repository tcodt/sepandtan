"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createExercise,
  deleteExercise,
  fetchAdminExercises,
  updateExercise,
} from "../api";
import type { ExerciseFilters, ExerciseInput } from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const exerciseKeys = {
  all: ["admin", "exercise"] as const,
  list: (filters: ExerciseFilters) =>
    [...exerciseKeys.all, "list", filters] as const,
};

export function useAdminExercises(filters: ExerciseFilters = {}) {
  return useQuery({
    queryKey: exerciseKeys.list(filters),
    queryFn: () => fetchAdminExercises(filters),
    placeholderData: (previous) => previous,
    staleTime: 20_000,
  });
}

export function useCreateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExerciseInput) => createExercise(input),
    onSuccess: async () => {
      toast.success("تمرین ایجاد شد");
      await queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ایجاد تمرین ناموفق بود"));
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExerciseInput }) =>
      updateExercise(id, input),
    onSuccess: async () => {
      toast.success("تمرین به‌روزرسانی شد");
      await queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی ناموفق بود"));
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: async () => {
      toast.success("تمرین حذف شد");
      await queryClient.invalidateQueries({ queryKey: exerciseKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "حذف ناموفق بود"));
    },
  });
}
