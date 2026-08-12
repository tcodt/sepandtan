"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/lib/store/user-store";
import { OnboardingWizard } from "../../components/onboarding/onboarding-wizard";

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useUserStore();

  useEffect(() => {
    // اگر کاربر لاگین نباشد → ثبت‌نام
    if (!isAuthenticated || !user) {
      router.replace("/register");
      return;
    }

    // اگر قبلاً آنبوردینگ را کامل کرده → داشبورد
    if (user.onboardingCompleted) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, user, router]);

  // تا زمانی که چک‌ها انجام شود چیزی نشان نده
  if (!isAuthenticated || !user || user.onboardingCompleted) {
    return null;
  }

  return <OnboardingWizard />;
}
