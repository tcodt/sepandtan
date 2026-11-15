"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";
import { setAccessToken } from "@/lib/api/client";
import type { UserRole } from "@/lib/types/plan";
import { getHomePathForRole } from "@/features/onboarding/utils";

type Options = {
  requireOnboarding?: boolean;
  onlyTrainee?: boolean;
  blockPending?: boolean;
  blockCoach?: boolean;
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

      // 1) تعلیق / حذف
      if (
        user.accountStatus === "SUSPENDED" ||
        user.accountStatus === "DELETED"
      ) {
        setAccessToken(null);
        useUserStore.getState().logout();
        router.replace(
          user.accountStatus === "SUSPENDED"
            ? "/login?reason=suspended"
            : "/login?reason=deleted",
        );
        return;
      }

      // 2) coach/seller در انتظار تأیید
      if (
        blockPending &&
        (user.role === "coach" || user.role === "seller") &&
        user.roleStatus &&
        user.roleStatus !== "approved"
      ) {
        router.replace(redirectToRolePending);
        return;
      }

      // 3) صفحه فقط trainee
      if (onlyTrainee) {
        if (user.role === "seller") {
          router.replace(
            user.roleStatus === "approved"
              ? redirectToSeller
              : redirectToRolePending,
          );
          return;
        }
        if (user.role === "coach") {
          router.replace(
            user.roleStatus === "approved"
              ? redirectToCoach
              : redirectToRolePending,
          );
          return;
        }
        if (user.role === "admin") {
          router.replace("/admin");
          return;
        }
        if (user.role !== "trainee") {
          router.replace(getHomePathForRole(user.role));
          return;
        }
      }

      // 4) بلاک صریح نقش
      if (blockCoach && user.role === "coach") {
        router.replace(redirectToCoach);
        return;
      }
      if (blockSeller && user.role === "seller") {
        router.replace(
          user.roleStatus === "approved"
            ? redirectToSeller
            : redirectToRolePending,
        );
        return;
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        router.replace(getHomePathForRole(user.role));
        return;
      }

      // 5) قفل حرفه‌ای → onboarding نده
      if (
        requireOnboarding &&
        user.role === "trainee" &&
        (user.professionalRoleLock === "seller" ||
          user.professionalRoleLock === "coach")
      ) {
        router.replace(redirectToDashboard);
        return;
      }

      // 6) onboarding ناقص
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
    isReady: mounted && hasHydrated,
  };
}
