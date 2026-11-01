"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { needsOnboarding } from "@/features/onboarding/utils";

/**
 * این hook را در layoutهای اصلی trainee (dashboard و ...) صدا بزن.
 * اگر onboarding ناقص باشد → به /onboarding می‌فرستد.
 */
export function useOnboardingGuard() {
  const { user, isReady, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isReady || !isAuthenticated || !user) return;

    // اگر در خود صفحه onboarding هستیم، کاری نکن
    if (pathname.startsWith("/onboarding")) return;

    if (needsOnboarding(user)) {
      router.replace("/onboarding");
    }
  }, [isReady, isAuthenticated, user, pathname, router]);
}
