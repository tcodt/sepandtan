"use client";

import { TodayNutrition } from "@/components/nutrition/today-nutrition";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function NutritionPage() {
  const { isLoading, isAuthenticated } = useRequireAuth({
    requireOnboarding: true,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <TodayNutrition />;
}
