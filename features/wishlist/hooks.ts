"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/api/client";
import { useUserStore } from "@/lib/store/user-store";
import {
  addToWishlist,
  fetchWishlistIds,
  fetchWishlistPage,
  removeFromWishlist,
} from "./api";

export const wishlistKeys = {
  all: ["wishlist"] as const,
  ids: () => [...wishlistKeys.all, "ids"] as const,
  page: (page: number) => [...wishlistKeys.all, "page", page] as const,
};

export function useWishlistIds(enabled?: boolean) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const hasHydrated = useUserStore((s) => s._hasHydrated);

  return useQuery({
    queryKey: wishlistKeys.ids(),
    queryFn: fetchWishlistIds,
    enabled: enabled !== false && hasHydrated && isAuthenticated,
    staleTime: 60_000,
  });
}

export function useWishlistPage(page: number, enabled = true) {
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const hasHydrated = useUserStore((s) => s._hasHydrated);

  return useQuery({
    queryKey: wishlistKeys.page(page),
    queryFn: () => fetchWishlistPage(page),
    enabled: enabled && hasHydrated && isAuthenticated && page >= 1,
    placeholderData: (prev) => prev,
  });
}

export function useIsInWishlist(productId: string): boolean {
  const { data: ids } = useWishlistIds();
  if (!productId || !ids?.length) return false;
  return ids.includes(productId);
}

export function useToggleWishlist() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      isInWishlist,
    }: {
      productId: string;
      isInWishlist: boolean;
    }) => {
      if (isInWishlist) await removeFromWishlist(productId);
      else await addToWishlist(productId);
    },

    onMutate: async ({ productId, isInWishlist }) => {
      await qc.cancelQueries({ queryKey: wishlistKeys.ids() });
      const previous = qc.getQueryData<string[]>(wishlistKeys.ids());

      qc.setQueryData<string[]>(wishlistKeys.ids(), (old) => {
        const list = old ?? [];
        if (isInWishlist) return list.filter((id) => id !== productId);
        if (list.includes(productId)) return list;
        return [...list, productId];
      });

      return { previous };
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.previous) {
        qc.setQueryData(wishlistKeys.ids(), ctx.previous);
      }
      toast.error(getErrorMessage(error, "عملیات علاقه‌مندی ناموفق بود"));
    },

    onSuccess: (_d, vars) => {
      toast.success(
        vars.isInWishlist
          ? "از علاقه‌مندی‌ها حذف شد"
          : "به علاقه‌مندی‌ها اضافه شد",
      );
    },

    onSettled: () => {
      void qc.invalidateQueries({ queryKey: wishlistKeys.all });
    },
  });
}
