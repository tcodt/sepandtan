"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchShippingForOrder, fetchShippingMethods } from "./api";

export const shippingKeys = {
  all: ["shipping"] as const,
  forOrder: (provinceId: string) =>
    [...shippingKeys.all, "order", provinceId] as const,
  methods: () => [...shippingKeys.all, "methods"] as const,
};

export function useShippingForOrder(provinceId: string | undefined) {
  return useQuery({
    queryKey: shippingKeys.forOrder(provinceId ?? ""),
    queryFn: () => fetchShippingForOrder(provinceId!),
    enabled: Boolean(provinceId),
  });
}

export function useShippingMethods(enabled = false) {
  return useQuery({
    queryKey: shippingKeys.methods(),
    queryFn: fetchShippingMethods,
    enabled,
  });
}
