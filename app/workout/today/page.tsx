"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TodayWorkout } from "@/components/workout/today-workout";
import { useUserStore } from "@/lib/store/user-store";

export default function TodayWorkoutPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useUserStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }
    if (!user.onboardingCompleted) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || !user || !user.onboardingCompleted) {
    return null;
  }

  return <TodayWorkout />;
}
