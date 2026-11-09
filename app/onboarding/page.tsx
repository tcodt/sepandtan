"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { OnboardingRouteGuard } from "@/components/onboarding/onboarding-route-guard";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function OnboardingPage() {
  const router = useRouter();

  const { isLoading, isAuthenticated, user } = useRequireAuth({
    requireOnboarding: false,
    onlyTrainee: true,
    blockPending: true,
  });

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (user.onboardingStatus === "completed" || user.onboardingCompleted) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (
    !user ||
    user.role !== "trainee" ||
    user.roleStatus !== "approved" ||
    user.onboardingStatus === "completed" ||
    user.onboardingCompleted
  ) {
    return null;
  }

  return (
    <OnboardingRouteGuard>
      <OnboardingWizard />
    </OnboardingRouteGuard>
  );
}
