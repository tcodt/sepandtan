"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import {
  createShippingRate,
  createStoreShipping,
  deleteShippingRate,
  deleteStoreShipping,
  fetchProvinces,
  fetchShippingMethods,
  fetchShippingRates,
  fetchStoreShippingMethods,
  updateShippingRate,
  updateStoreShipping,
} from "./api";
import type {
  CreateStoreShippingInput,
  UpdateStoreShippingInput,
  UpsertShippingRateInput,
} from "./types";

export const shippingKeys = {
  all: ["shipping"] as const,
  methods: () => [...shippingKeys.all, "methods"] as const,
  storeMethods: () => [...shippingKeys.all, "store-methods"] as const,
  rates: (methodId: string) =>
    [...shippingKeys.all, "rates", methodId] as const,
  provinces: () => [...shippingKeys.all, "provinces"] as const,
};

export function useShippingMethods() {
  return useQuery({
    queryKey: shippingKeys.methods(),
    queryFn: fetchShippingMethods,
    staleTime: 10 * 60 * 1000,
  });
}

export function useStoreShippingMethods() {
  return useQuery({
    queryKey: shippingKeys.storeMethods(),
    queryFn: fetchStoreShippingMethods,
  });
}

export function useShippingRates(methodId: string | null) {
  return useQuery({
    queryKey: shippingKeys.rates(methodId ?? ""),
    queryFn: () => fetchShippingRates(methodId!),
    enabled: Boolean(methodId),
  });
}

export function useProvinces() {
  return useQuery({
    queryKey: shippingKeys.provinces(),
    queryFn: fetchProvinces,
    staleTime: 30 * 60 * 1000,
  });
}

export function useCreateStoreShipping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateStoreShippingInput) =>
      createStoreShipping(payload),
    onSuccess: async () => {
      toast.success("روش ارسال اضافه شد");
      await qc.invalidateQueries({ queryKey: shippingKeys.storeMethods() });
    },
    onError: (e) =>
      toast.error(getErrorMessage(e, "ایجاد روش ارسال ناموفق بود")),
  });
}

export function useUpdateStoreShipping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateStoreShippingInput;
    }) => updateStoreShipping(id, payload),
    onSuccess: async () => {
      toast.success("روش ارسال به‌روزرسانی شد");
      await qc.invalidateQueries({ queryKey: shippingKeys.storeMethods() });
    },
    onError: (e) =>
      toast.error(getErrorMessage(e, "ویرایش روش ارسال ناموفق بود")),
  });
}

export function useDeleteStoreShipping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStoreShipping(id),
    onSuccess: async () => {
      toast.success("روش ارسال حذف شد");
      await qc.invalidateQueries({ queryKey: shippingKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف روش ارسال ناموفق بود")),
  });
}

export function useCreateShippingRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpsertShippingRateInput) =>
      createShippingRate(payload),
    onSuccess: async (_d, vars) => {
      toast.success("نرخ استان ثبت شد");
      await qc.invalidateQueries({
        queryKey: shippingKeys.rates(vars.storeShippingMethodId),
      });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ثبت نرخ ناموفق بود")),
  });
}

export function useUpdateShippingRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpsertShippingRateInput;
    }) => updateShippingRate(id, payload),
    onSuccess: async (_d, vars) => {
      toast.success("نرخ استان به‌روزرسانی شد");
      await qc.invalidateQueries({
        queryKey: shippingKeys.rates(vars.payload.storeShippingMethodId),
      });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ویرایش نرخ ناموفق بود")),
  });
}

export function useDeleteShippingRate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      storeShippingMethodId,
    }: {
      id: string;
      storeShippingMethodId: string;
    }) => deleteShippingRate(id).then(() => storeShippingMethodId),
    onSuccess: async (methodId) => {
      toast.success("نرخ استان حذف شد");
      await qc.invalidateQueries({ queryKey: shippingKeys.rates(methodId) });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف نرخ ناموفق بود")),
  });
}
