"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlanAccess } from "@/lib/types/access";
import { getActivePlanAccess } from "@/lib/api/access";
import { useUserStore } from "@/lib/store/user-store";

export function useActivePlan() {
  const userId = useUserStore((s) => s.user?.id);

  const [data, setData] = useState<PlanAccess | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getActivePlanAccess(userId);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در بارگذاری برنامه فعال");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    activeAccess: data,
    isLoading,
    error,
    refetch,
    hasActivePlan: !!data,
  };
}
