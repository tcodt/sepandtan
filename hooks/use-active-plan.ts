"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlanAccess } from "@/lib/types/access";
import { fetchCurrentUserPlan } from "@/features/user-plan/api";
import { toPlanAccessFromCurrent } from "@/features/user-plan/adapters";
import { useUserStore } from "@/lib/store/user-store";

/**
 * Active training plan from GET /user-plan/my/current
 * Still exposes PlanAccess shape for existing UI.
 *
 * MIGRATE consumers to useCurrentUserPlan() from features/user-plan/hooks
 * then delete this adapter hook.
 */
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
      const current = await fetchCurrentUserPlan();
      setData(current ? toPlanAccessFromCurrent(current, userId) : null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در بارگذاری برنامه فعال");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refetch();
  }, [refetch]);

  return {
    activeAccess: data,
    isLoading,
    error,
    refetch,
    hasActivePlan: !!data,
  };
}
