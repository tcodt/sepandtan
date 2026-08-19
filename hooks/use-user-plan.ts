"use client";

import { useEffect } from "react";
import { useUserStore } from "@/lib/store/user-store";
import { usePlanStore } from "@/lib/store/plan-store";

/**
 * بارگذاری خودکار برنامه فعلی کاربر
 * استفاده در: dashboard / workout/today / nutrition
 */
export function useUserPlan() {
  const user = useUserStore((s) => s.user);
  const { plan, todayDay, currentDayNumber, isLoading, error, loadPlan } =
    usePlanStore();

  useEffect(() => {
    if (user?.currentPlanId && user.onboardingCompleted) {
      // اگر همین plan قبلاً لود شده، دوباره نخوان
      if (plan?.id === user.currentPlanId) return;
      loadPlan(user.currentPlanId);
    }
  }, [user?.currentPlanId, user?.onboardingCompleted, plan?.id, loadPlan]);

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
