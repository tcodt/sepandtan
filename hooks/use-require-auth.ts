"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";
import type { UserRole } from "@/lib/types/plan";

type Options = {
  /** آیا آنبوردینگ کامل لازم است؟ */
  requireOnboarding?: boolean;
  /** آیا فقط trainee اجازه دارد؟ */
  onlyTrainee?: boolean;
  /** آیا کاربر pending را بلاک کند؟ */
  blockPending?: boolean;
  /** فقط این نقش‌ها اجازه ورود دارند */
  allowedRoles?: UserRole[];
  redirectToLogin?: string;
  redirectToOnboarding?: string;
  redirectToRolePending?: string;
  redirectToCoach?: string;
  redirectToDashboard?: string;
};

export function useRequireAuth(options: Options = {}) {
  const {
    requireOnboarding = false,
    onlyTrainee = false,
    blockPending = true,
    allowedRoles,
    redirectToLogin = "/login",
    redirectToOnboarding = "/onboarding",
    redirectToRolePending = "/role-pending",
    redirectToCoach = "/coach",
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
      // ۱. لاگین نکرده
      if (!isAuthenticated || !user) {
        router.replace(redirectToLogin);
        return;
      }

      // ۲. نقش در حالت pending / rejected / suspended
      if (blockPending && user.roleStatus !== "approved") {
        router.replace(redirectToRolePending);
        return;
      }

      // ۳. محدودیت نقش
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === "coach") {
          router.replace(redirectToCoach);
        } else {
          router.replace(redirectToDashboard);
        }
        return;
      }

      // ۴. فقط trainee
      if (onlyTrainee && user.role !== "trainee") {
        if (user.role === "coach") {
          router.replace(redirectToCoach);
        } else {
          router.replace(redirectToDashboard);
        }
        return;
      }

      // ۵. آنبوردینگ اجباری (فقط برای trainee)
      if (
        requireOnboarding &&
        user.role === "trainee" &&
        user.onboardingStatus !== "completed"
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
    allowedRoles,
    redirectToLogin,
    redirectToOnboarding,
    redirectToRolePending,
    redirectToCoach,
    redirectToDashboard,
    router,
  ]);

  const isLoading = !mounted || !hasHydrated;

  return {
    isLoading,
    isAuthenticated: !!isAuthenticated && !!user,
    user,
    ready: mounted && hasHydrated,
  };
}
