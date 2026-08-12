"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthReady } from "@/lib/store/user-store";

type Options = {
  /** اگر true باشد، onboarding هم باید کامل شده باشد */
  requireOnboarding?: boolean;
  /** مسیر جایگزین وقتی لاگین نیست */
  loginPath?: string;
  /** مسیر جایگزین وقتی onboarding کامل نیست */
  onboardingPath?: string;
};

export function useRequireAuth(options: Options = {}) {
  const {
    requireOnboarding = true,
    loginPath = "/login",
    onboardingPath = "/onboarding",
  } = options;

  const router = useRouter();
  const { ready, isAuthenticated, user } = useAuthReady();

  useEffect(() => {
    // هنوز از localStorage نخوانده → هیچ ریدایرکتی نکن
    if (!ready) return;

    if (!isAuthenticated || !user) {
      router.replace(loginPath);
      return;
    }

    if (requireOnboarding && !user.onboardingCompleted) {
      router.replace(onboardingPath);
    }
  }, [
    ready,
    isAuthenticated,
    user,
    requireOnboarding,
    loginPath,
    onboardingPath,
    router,
  ]);

  return {
    ready,
    isAuthenticated: ready && isAuthenticated && !!user,
    user: ready ? user : null,
    /** true یعنی هنوز در حال بررسی auth هستیم */
    isLoading: !ready,
  };
}
