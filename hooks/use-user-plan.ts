"use client";

import { useEffect } from "react";
import { useUserStore } from "@/lib/store/user-store";
import { usePlanStore } from "@/lib/store/plan-store";

/**
 * بارگذاری خودکار برنامه تمرینی فعال کاربر
 * منبع حقیقت: user.currentPlanId
 *
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

  const onboardingDone =
    !!user &&
    (user.onboardingStatus === "completed" || !!user.onboardingCompleted);

  const planId = user?.currentPlanId ?? null;

  useEffect(() => {
    // کاربر آنبوردینگ نکرده یا برنامه فعال ندارد
    if (!onboardingDone || !planId) {
      if (plan) clearPlan();
      return;
    }

    // اگر همین برنامه از قبل لود شده، دوباره نخوان
    if (plan?.id === planId) return;

    loadPlan(planId);
  }, [onboardingDone, planId, plan?.id, loadPlan, clearPlan, plan]);

  const hasPlan = !!plan && !!todayDay;
  const noPlan = onboardingDone && !planId;
  const isPlanLoading = onboardingDone && !!planId && isLoading;

  return {
    user,
    plan,
    todayDay,
    currentDayNumber,
    isLoading: isPlanLoading,
    error,
    hasPlan,
    /** کاربر آنبوردینگ کرده ولی currentPlanId ندارد */
    noPlan,
    /** آنبوردینگ تمام شده و planId وجود دارد */
    hasPlanId: !!planId,
  };
}
