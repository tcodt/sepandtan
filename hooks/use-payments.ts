"use client";

import { useCallback, useEffect, useState } from "react";
import type { Payment } from "@/lib/types/access";
import { getUserPayments, getPaymentSummary } from "@/lib/api/payments";
import { useUserStore } from "@/lib/store/user-store";

type Summary = {
  totalPaid: number;
  paymentCount: number;
  lastPayment: Payment | null;
};

export function usePayments() {
  const userId = useUserStore((s) => s.user?.id);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!userId) {
      setPayments([]);
      setSummary(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [paymentsResult, summaryResult] = await Promise.all([
        getUserPayments(userId),
        getPaymentSummary(userId),
      ]);
      setPayments(paymentsResult);
      setSummary(summaryResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "خطا در بارگذاری پرداخت‌ها");
      setPayments([]);
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    payments,
    summary,
    isLoading,
    error,
    refetch,
    isEmpty: !isLoading && payments.length === 0,
  };
}
