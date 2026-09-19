"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";
import type { UserRole } from "@/lib/types/plan";

type Options = {
  requireOnboarding?: boolean;
  /** اگر true باشد، مربی‌ها را به /coach هدایت می‌کند */
  blockCoach?: boolean;
  /** فقط این نقش‌ها اجازه ورود دارند */
  allowedRoles?: UserRole[];
  redirectToLogin?: string;
  redirectToOnboarding?: string;
  redirectToCoach?: string;
};

export function useRequireAuth(options: Options = {}) {
  const {
    requireOnboarding = false,
    blockCoach = false,
    allowedRoles,
    redirectToLogin = "/login",
    redirectToOnboarding = "/onboarding",
    redirectToCoach = "/coach",
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

      // مربی نباید صفحات کاربر را ببیند
      if (blockCoach && user.role === "coach") {
        router.replace(redirectToCoach);
        return;
      }

      // محدودیت نقش
      if (allowedRoles && !allowedRoles.includes(user.role)) {
        if (user.role === "coach") {
          router.replace(redirectToCoach);
        } else {
          router.replace("/dashboard");
        }
        return;
      }

      if (requireOnboarding && !user.onboardingCompleted) {
        router.replace(redirectToOnboarding);
      }
    }, 0);

    return () => window.clearTimeout(t);
  }, [
    mounted,
    hasHydrated,
    isAuthenticated,
    user,
    requireOnboarding,
    blockCoach,
    allowedRoles,
    redirectToLogin,
    redirectToOnboarding,
    redirectToCoach,
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
