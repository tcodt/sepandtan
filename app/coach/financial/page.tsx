"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { CoachFinancialScreen } from "@/components/coach/financial/coach-financial-screen";

export default function CoachFinancialPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useRequireAuth({
    requireOnboarding: false,
  });

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated || !user) return;
    if (user.role !== "coach" && user.role !== "admin") {
      router.replace("/account");
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (user.role !== "coach" && user.role !== "admin") {
    return null;
  }

  return <CoachFinancialScreen />;
}
