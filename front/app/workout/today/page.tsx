"use client";

import { TodayWorkout } from "@/components/workout/today-workout";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function TodayWorkoutPage() {
  const { isLoading, isAuthenticated, user } = useRequireAuth({
    requireOnboarding: true,
    blockCoach: true, // ← مربی اینجا نیاید
  });

  // تا hydrate و چک auth تمام نشده، redirect نکن و spinner نشان بده
  if (isLoading || !isAuthenticated || user?.role === "coach") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <TodayWorkout />;
}
