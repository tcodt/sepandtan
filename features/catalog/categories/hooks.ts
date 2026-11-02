"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import {
  createCategory,
  deleteCategory,
  fetchCategoriesAdmin,
  fetchCategorySelector,
  fetchCategoryTree,
  updateCategory,
} from "./api";
import type {
  CategoriesAdminFilters,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../types";

export const categoryKeys = {
  all: ["catalog", "categories"] as const,
  tree: () => [...categoryKeys.all, "tree"] as const,
  selector: (allCategory: boolean) =>
    [...categoryKeys.all, "selector", allCategory] as const,
  admin: (filters: CategoriesAdminFilters) =>
    [...categoryKeys.all, "admin", filters] as const,
};

export function useCategoryTree() {
  return useQuery({
    queryKey: categoryKeys.tree(),
    queryFn: fetchCategoryTree,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategorySelector(allCategory = true) {
  return useQuery({
    queryKey: categoryKeys.selector(allCategory),
    queryFn: () => fetchCategorySelector(allCategory),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoriesAdmin(filters: CategoriesAdminFilters) {
  return useQuery({
    queryKey: categoryKeys.admin(filters),
    queryFn: () => fetchCategoriesAdmin(filters),
    placeholderData: (prev) => prev,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryInput) => createCategory(payload),
    onSuccess: async () => {
      toast.success("دسته‌بندی ایجاد شد");
      await qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (e) =>
      toast.error(getErrorMessage(e, "ایجاد دسته‌بندی ناموفق بود")),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCategoryInput;
    }) => updateCategory(id, payload),
    onSuccess: async () => {
      toast.success("دسته‌بندی به‌روزرسانی شد");
      await qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (e) =>
      toast.error(getErrorMessage(e, "ویرایش دسته‌بندی ناموفق بود")),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: async () => {
      toast.success("دسته‌بندی حذف شد");
      await qc.invalidateQueries({ queryKey: categoryKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف دسته‌بندی ناموفق بود")),
  });
}
