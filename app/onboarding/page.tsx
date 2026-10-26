"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function OnboardingPage() {
  const router = useRouter();

  const { isLoading, isAuthenticated, user } = useRequireAuth({
    requireOnboarding: false, // خود این صفحه onboarding است
    onlyTrainee: true, // فقط trainee اجازه دارد
    blockPending: true,
  });

  useEffect(() => {
    if (isLoading) return;

    // اگر آنبوردینگ کامل شده → داشبورد
    if (
      isAuthenticated &&
      user &&
      (user.onboardingStatus === "completed" || user.onboardingCompleted)
    ) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // فقط trainee با وضعیت approved و آنبوردینگ ناقص اجازه دیدن wizard را دارد
  if (
    !user ||
    user.role !== "trainee" ||
    user.roleStatus !== "approved" ||
    user.onboardingStatus === "completed" ||
    user.onboardingCompleted
  ) {
    return null;
  }

  return <OnboardingWizard />;
}
