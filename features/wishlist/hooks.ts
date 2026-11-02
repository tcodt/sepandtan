"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import { addToWishlist, fetchWishlistIds, removeFromWishlist } from "./api";

export const wishlistKeys = {
  all: ["wishlist"] as const,
  ids: () => [...wishlistKeys.all, "ids"] as const,
};

export function useWishlistIds(enabled = true) {
  return useQuery({
    queryKey: wishlistKeys.ids(),
    queryFn: fetchWishlistIds,
    enabled,
    staleTime: 60_000,
  });
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
    onSuccess: async (_d, vars) => {
      toast.success(
        vars.isInWishlist
          ? "از علاقه‌مندی‌ها حذف شد"
          : "به علاقه‌مندی‌ها اضافه شد",
      );
      await qc.invalidateQueries({ queryKey: wishlistKeys.all });
    },
    onError: (e) =>
      toast.error(getErrorMessage(e, "عملیات علاقه‌مندی ناموفق بود")),
  });
}
