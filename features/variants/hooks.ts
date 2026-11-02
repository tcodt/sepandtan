"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import {
  createAttributeDefinition,
  createVariant,
  deleteAttributeDefinition,
  deleteVariant,
  fetchAttributeDefinitions,
  fetchProductVariants,
  updateAttributeDefinition,
  updateVariant,
} from "./api";
import type {
  AttributeDefinitionFilters,
  AttributeDefinitionInput,
  CreateVariantInput,
  UpdateVariantInput,
} from "./types";

export const variantKeys = {
  all: ["variants"] as const,
  byProduct: (productId: string) =>
    [...variantKeys.all, "product", productId] as const,
  attributes: (filters: AttributeDefinitionFilters) =>
    [...variantKeys.all, "attributes", filters] as const,
};

export function useProductVariants(productId: string, enabled = true) {
  return useQuery({
    queryKey: variantKeys.byProduct(productId),
    queryFn: () => fetchProductVariants(productId),
    enabled: enabled && Boolean(productId),
  });
}

export function useAttributeDefinitions(
  filters: AttributeDefinitionFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: variantKeys.attributes(filters),
    queryFn: () => fetchAttributeDefinitions(filters),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateAttributeDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AttributeDefinitionInput) =>
      createAttributeDefinition(payload),
    onSuccess: async () => {
      toast.success("ویژگی تعریف شد");
      await qc.invalidateQueries({ queryKey: variantKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "تعریف ویژگی ناموفق بود")),
  });
}

export function useUpdateAttributeDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: AttributeDefinitionInput;
    }) => updateAttributeDefinition(id, payload),
    onSuccess: async () => {
      toast.success("ویژگی به‌روزرسانی شد");
      await qc.invalidateQueries({ queryKey: variantKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ویرایش ویژگی ناموفق بود")),
  });
}

export function useDeleteAttributeDefinition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAttributeDefinition(id),
    onSuccess: async () => {
      toast.success("ویژگی حذف شد");
      await qc.invalidateQueries({ queryKey: variantKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف ویژگی ناموفق بود")),
  });
}

export function useCreateVariant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateVariantInput) => createVariant(payload),
    onSuccess: async (_data, vars) => {
      toast.success("واریانت ایجاد شد");
      await qc.invalidateQueries({
        queryKey: variantKeys.byProduct(vars.productId),
      });
      await qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ایجاد واریانت ناموفق بود")),
  });
}

export function useUpdateVariant(productId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      variantId,
      payload,
    }: {
      variantId: string;
      payload: UpdateVariantInput;
    }) => updateVariant(variantId, payload),
    onSuccess: async () => {
      toast.success("واریانت به‌روزرسانی شد");
      if (productId) {
        await qc.invalidateQueries({
          queryKey: variantKeys.byProduct(productId),
        });
      } else {
        await qc.invalidateQueries({ queryKey: variantKeys.all });
      }
      await qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) =>
      toast.error(getErrorMessage(e, "ویرایش واریانت ناموفق بود")),
  });
}

export function useDeleteVariant(productId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) => deleteVariant(variantId),
    onSuccess: async () => {
      toast.success("واریانت حذف شد");
      if (productId) {
        await qc.invalidateQueries({
          queryKey: variantKeys.byProduct(productId),
        });
      } else {
        await qc.invalidateQueries({ queryKey: variantKeys.all });
      }
      await qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف واریانت ناموفق بود")),
  });
}
