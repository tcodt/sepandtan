"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import {
  addToCart,
  clearCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from "./api";
import type { AddToCartInput, UpdateCartItemInput } from "./types";

export const cartKeys = {
  all: ["cart"] as const,
  me: () => [...cartKeys.all, "me"] as const,
};

export function useCart(enabled = true) {
  return useQuery({
    queryKey: cartKeys.me(),
    queryFn: fetchCart,
    enabled,
    staleTime: 15_000,
  });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddToCartInput) => addToCart(payload),
    onSuccess: async () => {
      toast.success("به سبد خرید اضافه شد");
      await qc.invalidateQueries({ queryKey: cartKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "افزودن به سبد ناموفق بود")),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: UpdateCartItemInput;
    }) => updateCartItem(itemId, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: cartKeys.all });
    },
    onError: (e) =>
      toast.error(getErrorMessage(e, "به‌روزرسانی سبد ناموفق بود")),
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: async () => {
      toast.success("از سبد حذف شد");
      await qc.invalidateQueries({ queryKey: cartKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف از سبد ناموفق بود")),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clearCart(),
    onSuccess: async () => {
      toast.success("سبد خرید خالی شد");
      await qc.invalidateQueries({ queryKey: cartKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "خالی کردن سبد ناموفق بود")),
  });
}
