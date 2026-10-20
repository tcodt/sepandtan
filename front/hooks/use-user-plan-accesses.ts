"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PlanAccess } from "@/lib/types/access";
import { getUserPlanAccesses } from "@/lib/api/access";
import { useUserStore } from "@/lib/store/user-store";

export function useUserPlanAccesses() {
  const userId = useUserStore((s) => s.user?.id);

  const [data, setData] = useState<PlanAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setData([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserPlanAccesses(userId);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در بارگذاری برنامه‌ها");
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const activeAccesses = useMemo(
    () => data.filter((a) => a.status === "active"),
    [data],
  );
  const expiredAccesses = useMemo(
    () => data.filter((a) => a.status === "expired"),
    [data],
  );
  const pendingAccesses = useMemo(
    () => data.filter((a) => a.status === "pending_activation"),
    [data],
  );

  return {
    accesses: data,
    activeAccesses,
    expiredAccesses,
    pendingAccesses,
    isLoading,
    error,
    refetch,
    isEmpty: !isLoading && data.length === 0,
  };
}
