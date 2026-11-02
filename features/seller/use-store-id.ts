"use client";

import { useMemo } from "react";
import { useAdminProducts } from "@/features/products/hooks";
import { useAuth } from "@/features/auth/hooks/use-auth";

/**
 * اولویت:
 * 1) اگر بعداً روی user.storeId گذاشتید
 * 2) storeId اولین محصول فروشنده از /products/ADMIN
 */
export function useSellerStoreId() {
  const { user } = useAuth();
  const extraStoreId =
    user && "storeId" in user
      ? (user as { storeId?: string }).storeId
      : undefined;

  const { data, isLoading, isError } = useAdminProducts(
    { page: 1, limit: 1 },
    // اگر hook شما enabled نمی‌گیرد، این آرگومان را حذف کنید
  );

  const fromProducts = data?.products?.[0]?.storeId ?? null;

  const storeId = useMemo(
    () => extraStoreId || fromProducts || null,
    [extraStoreId, fromProducts],
  );

  return {
    storeId,
    isLoading: !extraStoreId && isLoading,
    isError,
  };
}
