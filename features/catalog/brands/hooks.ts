"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import {
  createBrand,
  deleteBrand,
  fetchBrands,
  fetchBrandsAdmin,
  updateBrand,
} from "./api";
import type { BrandInput, BrandsAdminFilters } from "../types";

export const brandKeys = {
  all: ["catalog", "brands"] as const,
  public: () => [...brandKeys.all, "public"] as const,
  admin: (filters: BrandsAdminFilters) =>
    [...brandKeys.all, "admin", filters] as const,
};

export function useBrands() {
  return useQuery({
    queryKey: brandKeys.public(),
    queryFn: fetchBrands,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBrandsAdmin(filters: BrandsAdminFilters) {
  return useQuery({
    queryKey: brandKeys.admin(filters),
    queryFn: () => fetchBrandsAdmin(filters),
    placeholderData: (prev) => prev,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: BrandInput) => createBrand(payload),
    onSuccess: async () => {
      toast.success("برند ایجاد شد");
      await qc.invalidateQueries({ queryKey: brandKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ایجاد برند ناموفق بود")),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: BrandInput }) =>
      updateBrand(id, payload),
    onSuccess: async () => {
      toast.success("برند به‌روزرسانی شد");
      await qc.invalidateQueries({ queryKey: brandKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ویرایش برند ناموفق بود")),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBrand(id),
    onSuccess: async () => {
      toast.success("برند حذف شد");
      await qc.invalidateQueries({ queryKey: brandKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف برند ناموفق بود")),
  });
}
