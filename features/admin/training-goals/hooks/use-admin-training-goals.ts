"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createTrainingGoal,
  deleteTrainingGoal,
  fetchAdminTrainingGoals,
  updateTrainingGoal,
} from "../api";
import type { TrainingGoalInput, TrainingGoalsFilters } from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const trainingGoalsKeys = {
  all: ["admin", "training-goals"] as const,
  list: (filters: TrainingGoalsFilters) =>
    [...trainingGoalsKeys.all, "list", filters] as const,
  catalog: ["catalog", "training-goals"] as const,
};

export function useAdminTrainingGoals(filters: TrainingGoalsFilters = {}) {
  return useQuery({
    queryKey: trainingGoalsKeys.list(filters),
    queryFn: () => fetchAdminTrainingGoals(filters),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

export function useCreateTrainingGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: TrainingGoalInput) => createTrainingGoal(input),
    onSuccess: async () => {
      toast.success("هدف تمرینی ایجاد شد");
      await queryClient.invalidateQueries({ queryKey: trainingGoalsKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ایجاد هدف ناموفق بود"));
    },
  });
}

export function useUpdateTrainingGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: TrainingGoalInput }) =>
      updateTrainingGoal(id, input),
    onSuccess: async () => {
      toast.success("هدف تمرینی به‌روزرسانی شد");
      await queryClient.invalidateQueries({ queryKey: trainingGoalsKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی ناموفق بود"));
    },
  });
}

export function useDeleteTrainingGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTrainingGoal(id),
    onSuccess: async () => {
      toast.success("هدف تمرینی حذف شد");
      await queryClient.invalidateQueries({ queryKey: trainingGoalsKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "حذف ناموفق بود"));
    },
  });
}
