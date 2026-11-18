"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { createFood, deleteFood, fetchAdminFoods, updateFood } from "../api";
import type { FoodFilters, FoodInput } from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const foodKeys = {
  all: ["admin", "food"] as const,
  list: (filters: FoodFilters) => [...foodKeys.all, "list", filters] as const,
};

export function useAdminFoods(filters: FoodFilters = {}) {
  return useQuery({
    queryKey: foodKeys.list(filters),
    queryFn: () => fetchAdminFoods(filters),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

export function useCreateFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FoodInput) => createFood(input),
    onSuccess: async () => {
      toast.success("غذا ایجاد شد");
      await queryClient.invalidateQueries({ queryKey: foodKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ایجاد غذا ناموفق بود"));
    },
  });
}

export function useUpdateFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: FoodInput }) =>
      updateFood(id, input),
    onSuccess: async () => {
      toast.success("غذا به‌روزرسانی شد");
      await queryClient.invalidateQueries({ queryKey: foodKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی ناموفق بود"));
    },
  });
}

export function useDeleteFood() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFood(id),
    onSuccess: async () => {
      toast.success("غذا حذف شد");
      await queryClient.invalidateQueries({ queryKey: foodKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "حذف ناموفق بود"));
    },
  });
}
