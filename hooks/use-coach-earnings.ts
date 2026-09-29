"use client";

import { useCallback, useEffect, useState } from "react";
import type { CoachSale, CoachEarningsSummary } from "@/lib/types/access";
import {
  getCoachSales,
  getCoachEarningsSummaryById,
} from "@/lib/api/coach-earnings";
import { useUserStore } from "@/lib/store/user-store";

export function useCoachEarnings(coachId?: string) {
  const currentUser = useUserStore((s) => s.user);
  const effectiveCoachId =
    coachId ?? (currentUser?.role === "coach" ? currentUser.id : undefined);

  const [summary, setSummary] = useState<CoachEarningsSummary | null>(null);
  const [sales, setSales] = useState<CoachSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!effectiveCoachId) {
      setSummary(null);
      setSales([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [summaryResult, salesResult] = await Promise.all([
        getCoachEarningsSummaryById(effectiveCoachId),
        getCoachSales(effectiveCoachId),
      ]);
      setSummary(summaryResult);
      setSales(salesResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در بارگذاری درآمد مربی");
      setSummary(null);
      setSales([]);
    } finally {
      setIsLoading(false);
    }
  }, [effectiveCoachId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    summary,
    sales,
    isLoading,
    error,
    refetch,
    isEmpty: !isLoading && sales.length === 0,
  };
}
