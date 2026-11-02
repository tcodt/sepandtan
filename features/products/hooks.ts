"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import {
  approveProduct,
  createProduct,
  deleteProduct,
  fetchAdminProducts,
  fetchProductByIdOrSlug,
  fetchProducts,
  fetchRelatedProducts,
  toggleProductFeature,
  updateProduct,
} from "./api";
import type {
  AdminProductFilters,
  CreateProductInput,
  ProductListFilters,
  UpdateProductInput,
} from "./types";

export const productKeys = {
  all: ["products"] as const,
  list: (filters: ProductListFilters) =>
    [...productKeys.all, "list", filters] as const,
  detail: (idOrSlug: string) =>
    [...productKeys.all, "detail", idOrSlug] as const,
  related: (slug: string) => [...productKeys.all, "related", slug] as const,
  admin: (filters: AdminProductFilters) =>
    [...productKeys.all, "admin", filters] as const,
};

export function useProducts(filters: ProductListFilters = {}) {
  return useQuery({
    queryKey: productKeys.list(filters),
    queryFn: () => fetchProducts(filters),
    placeholderData: (prev) => prev,
  });
}

export function useProductDetail(idOrSlug: string, enabled = true) {
  return useQuery({
    queryKey: productKeys.detail(idOrSlug),
    queryFn: () => fetchProductByIdOrSlug(idOrSlug),
    enabled: enabled && Boolean(idOrSlug),
  });
}

export function useRelatedProducts(slug: string, enabled = true) {
  return useQuery({
    queryKey: productKeys.related(slug),
    queryFn: () => fetchRelatedProducts(slug),
    enabled: enabled && Boolean(slug),
  });
}

export function useAdminProducts(filters: AdminProductFilters = {}) {
  return useQuery({
    queryKey: productKeys.admin(filters),
    queryFn: () => fetchAdminProducts(filters),
    placeholderData: (prev) => prev,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductInput) => createProduct(payload),
    onSuccess: async () => {
      toast.success("محصول ثبت شد");
      await qc.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ثبت محصول ناموفق بود")),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateProductInput;
    }) => updateProduct(id, payload),
    onSuccess: async () => {
      toast.success("محصول به‌روزرسانی شد");
      await qc.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ویرایش محصول ناموفق بود")),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: async () => {
      toast.success("محصول حذف شد");
      await qc.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف محصول ناموفق بود")),
  });
}

export function useApproveProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveProduct(id),
    onSuccess: async () => {
      toast.success("محصول تأیید شد");
      await qc.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "تأیید محصول ناموفق بود")),
  });
}

export function useToggleProductFeature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => toggleProductFeature(id),
    onSuccess: async () => {
      toast.success("وضعیت ویژه بودن تغییر کرد");
      await qc.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (e) =>
      toast.error(getErrorMessage(e, "تغییر وضعیت ویژه ناموفق بود")),
  });
}
