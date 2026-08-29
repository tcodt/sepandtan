"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WelcomeFirstActionScreen } from "@/components/welcome/welcome-first-action-screen";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function WelcomePage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useRequireAuth({
    requireOnboarding: true,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user && !user.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || !user?.onboardingCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <WelcomeFirstActionScreen />;
}
