"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";
import type { UserRole } from "@/lib/types/plan";
import { getHomePathForRole } from "@/features/onboarding/utils";

type Options = {
  requireOnboarding?: boolean;
  onlyTrainee?: boolean;
  blockPending?: boolean;
  /** مربی را از صفحات trainee دور کن */
  blockCoach?: boolean;
  /** فروشنده را از صفحات trainee دور کن */
  blockSeller?: boolean;
  allowedRoles?: UserRole[];
  redirectToLogin?: string;
  redirectToOnboarding?: string;
  redirectToRolePending?: string;
  redirectToCoach?: string;
  redirectToSeller?: string;
  redirectToDashboard?: string;
};

export function useRequireAuth(options: Options = {}) {
  const {
    requireOnboarding = false,
    onlyTrainee = false,
    blockPending = true,
    blockCoach = false,
    blockSeller = false,
    allowedRoles,
    redirectToLogin = "/login",
    redirectToOnboarding = "/onboarding",
    redirectToRolePending = "/role-pending",
    redirectToCoach = "/coach",
    redirectToSeller = "/seller",
    redirectToDashboard = "/dashboard",
  } = options;

  const router = useRouter();
  const hasHydrated = useUserStore((s) => s._hasHydrated);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const user = useUserStore((s) => s.user);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !hasHydrated) return;

    const t = window.setTimeout(() => {
      if (!isAuthenticated || !user) {
        router.replace(redirectToLogin);
        return;
      }

      if (blockPending && user.roleStatus && user.roleStatus !== "approved") {
        // ادمین/کاربر عادی معمولاً approved هستند؛ coach/seller pending اینجا می‌مانند
        if (user.role === "coach" || user.role === "seller") {
          router.replace(redirectToRolePending);
          return;
        }
      }

      if (blockCoach && user.role === "coach") {
        router.replace(redirectToCoach);
        return;
      }

      if (blockSeller && user.role === "seller") {
        router.replace(redirectToSeller);
        return;
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.replace(getHomePathForRole(user.role));
        return;
      }

      if (onlyTrainee && user.role !== "trainee") {
        router.replace(getHomePathForRole(user.role));
        return;
      }

      if (
        requireOnboarding &&
        user.role === "trainee" &&
        user.onboardingStatus !== "completed" &&
        !user.onboardingCompleted
      ) {
        router.replace(redirectToOnboarding);
        return;
      }
    }, 0);

    return () => window.clearTimeout(t);
  }, [
    mounted,
    hasHydrated,
    isAuthenticated,
    user,
    requireOnboarding,
    onlyTrainee,
    blockPending,
    blockCoach,
    blockSeller,
    allowedRoles,
    redirectToLogin,
    redirectToOnboarding,
    redirectToRolePending,
    redirectToCoach,
    redirectToSeller,
    redirectToDashboard,
    router,
  ]);

  const isLoading = !mounted || !hasHydrated;

  return {
    isLoading,
    isAuthenticated: !!isAuthenticated && !!user,
    user,
    ready: mounted && hasHydrated,
    /** alias سازگار با layoutهای قدیمی */
    isReady: mounted && hasHydrated,
  };
}
