"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  fetchAdminCheckouts,
  fetchAdminStoreOrders,
  updateAdminStoreOrder,
} from "../api";
import type { AdminOrdersFilters, UpdateStoreOrderPayload } from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const ordersAdminKeys = {
  all: ["admin", "orders"] as const,
  storeOrders: (filters: AdminOrdersFilters) =>
    [...ordersAdminKeys.all, "store-orders", filters] as const,
  checkouts: (filters: AdminOrdersFilters) =>
    [...ordersAdminKeys.all, "checkouts", filters] as const,
};

export function useAdminStoreOrders(filters: AdminOrdersFilters = {}) {
  return useQuery({
    queryKey: ordersAdminKeys.storeOrders(filters),
    queryFn: () => fetchAdminStoreOrders(filters),
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  });
}

export function useAdminCheckouts(filters: AdminOrdersFilters = {}) {
  return useQuery({
    queryKey: ordersAdminKeys.checkouts(filters),
    queryFn: () => fetchAdminCheckouts(filters),
    placeholderData: (prev) => prev,
    staleTime: 15_000,
  });
}

export function useUpdateAdminStoreOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateStoreOrderPayload;
    }) => updateAdminStoreOrder(id, payload),
    onSuccess: async () => {
      toast.success("وضعیت سفارش به‌روزرسانی شد");
      await qc.invalidateQueries({ queryKey: ordersAdminKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی سفارش ناموفق بود"));
    },
  });
}
