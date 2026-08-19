"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";

type Options = {
  requireOnboarding?: boolean;
  redirectToLogin?: string;
  redirectToOnboarding?: string;
};

export function useRequireAuth(options: Options = {}) {
  const {
    requireOnboarding = false,
    redirectToLogin = "/login",
    redirectToOnboarding = "/onboarding",
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
    // تا client mount + hydrate تمام نشده، هیچ redirectی نزن
    if (!mounted || !hasHydrated) return;

    // کمی تأخیر خیلی کوتاه تا router initialize شود
    const t = window.setTimeout(() => {
      if (!isAuthenticated || !user) {
        router.replace(redirectToLogin);
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
    redirectToLogin,
    redirectToOnboarding,
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
