"use client";

import { useEffect } from "react";
import { useUserStore } from "@/lib/store/user-store";
import { usePlanStore } from "@/lib/store/plan-store";

/**
 * بارگذاری خودکار برنامه فعال کاربر
 * استفاده در: dashboard / workout/today / nutrition
 */
export function useUserPlan() {
  const user = useUserStore((s) => s.user);
  const {
    plan,
    todayDay,
    currentDayNumber,
    isLoading,
    error,
    loadPlan,
    clearPlan,
  } = usePlanStore();

  useEffect(() => {
    if (!user?.onboardingCompleted || !user.currentPlanId) {
      if (plan) clearPlan();
      return;
    }

    if (plan?.id === user.currentPlanId) return;

    loadPlan(user.currentPlanId);
  }, [
    user?.currentPlanId,
    user?.onboardingCompleted,
    plan?.id,
    loadPlan,
    clearPlan,
    plan,
  ]);

  return {
    user,
    plan,
    todayDay,
    currentDayNumber,
    isLoading,
    error,
    hasPlan: !!plan && !!todayDay,
  };
}
