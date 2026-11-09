"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useUserStore } from "@/lib/store/user-store";
import { getRoleMismatchRedirect } from "@/features/onboarding/utils";

export function OnboardingRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    const href = getRoleMismatchRedirect(user, "/onboarding");
    if (href) router.replace(href);
  }, [user, router]);

  // seller/coach/admin اصلاً UI آنبوردینگ را نبینند
  if (user && user.role !== "trainee") {
    return null;
  }
  if (user?.professionalRoleLock === "seller") {
    return null;
  }

  return <>{children}</>;
}

export default function OnboardingPage() {
  const router = useRouter();

  const { isLoading, isAuthenticated, user } = useRequireAuth({
    requireOnboarding: false,
    onlyTrainee: true,
    blockPending: true,
  });

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;

    // اگر onboarding کامل شده → داشبورد
    if (user.onboardingStatus === "completed" || user.onboardingCompleted) {
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

  // فقط trainee تأییدشده با onboarding ناقص اجازه دیدن wizard را دارد
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
