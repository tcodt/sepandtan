"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import { cartKeys } from "@/features/cart/hooks";
import {
  createCheckout,
  deleteCheckout,
  fetchAdminCheckouts,
  fetchCheckoutById,
  fetchMyCheckouts,
  fetchStoreOrders,
  payCheckout,
  updateStoreOrderStatus,
} from "./api";
import type {
  CreateCheckoutInput,
  MyCheckoutsFilters,
  StoreOrdersFilters,
  UpdateStoreOrderInput,
} from "./types";

export const orderKeys = {
  all: ["orders"] as const,
  mine: (filters: MyCheckoutsFilters) =>
    [...orderKeys.all, "me", filters] as const,
  detail: (id: string) => [...orderKeys.all, "detail", id] as const,
  admin: (filters: MyCheckoutsFilters) =>
    [...orderKeys.all, "admin", filters] as const,
  store: (storeId: string, filters: StoreOrdersFilters) =>
    [...orderKeys.all, "store", storeId, filters] as const,
};

export function useMyCheckouts(filters: MyCheckoutsFilters = {}) {
  return useQuery({
    queryKey: orderKeys.mine(filters),
    queryFn: () => fetchMyCheckouts(filters),
    placeholderData: (p) => p,
  });
}

export function useCheckoutDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => fetchCheckoutById(id),
    enabled: enabled && Boolean(id),
  });
}

export function useAdminCheckouts(filters: MyCheckoutsFilters = {}) {
  return useQuery({
    queryKey: orderKeys.admin(filters),
    queryFn: () => fetchAdminCheckouts(filters),
    placeholderData: (p) => p,
  });
}

export function useStoreOrders(
  storeId: string,
  filters: StoreOrdersFilters = {},
  enabled = true,
) {
  return useQuery({
    queryKey: orderKeys.store(storeId, filters),
    queryFn: () => fetchStoreOrders(storeId, filters),
    enabled: enabled && Boolean(storeId),
    placeholderData: (p) => p,
  });
}

export function useCreateCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCheckoutInput) => createCheckout(payload),
    onSuccess: async () => {
      toast.success("سفارش ثبت شد");
      await qc.invalidateQueries({ queryKey: orderKeys.all });
      await qc.invalidateQueries({ queryKey: cartKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ثبت سفارش ناموفق بود")),
  });
}

export function usePayCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (checkoutId: string) => payCheckout(checkoutId),
    onSuccess: async () => {
      toast.success("پرداخت ثبت شد");
      await qc.invalidateQueries({ queryKey: orderKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "پرداخت ناموفق بود")),
  });
}

export function useUpdateStoreOrderStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: UpdateStoreOrderInput;
    }) => updateStoreOrderStatus(orderId, payload),
    onSuccess: async () => {
      toast.success("وضعیت سفارش به‌روز شد");
      await qc.invalidateQueries({ queryKey: orderKeys.all });
    },
    onError: (e) =>
      toast.error(getErrorMessage(e, "به‌روزرسانی وضعیت ناموفق بود")),
  });
}

export function useDeleteCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCheckout(id),
    onSuccess: async () => {
      toast.success("سفارش حذف شد");
      await qc.invalidateQueries({ queryKey: orderKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف سفارش ناموفق بود")),
  });
}
