"use client";

import { useCallback, useEffect, useState } from "react";
import { useUserStore } from "@/lib/store/user-store";
import {
  getWeightLogs,
  getWorkoutLogs,
  getNutritionLogs,
} from "@/lib/api/logs";
import type { WeightLog, WorkoutLog, NutritionLog } from "@/lib/types/plan";

type DashboardLogs = {
  weights: WeightLog[];
  workouts: WorkoutLog[];
  nutritions: NutritionLog[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * یک fetch واحد برای کل داشبورد
 * به‌جای اینکه هر کارت جدا API بزند
 */
export function useDashboardLogs(refreshKey = 0): DashboardLogs {
  const userId = useUserStore((s) => s.user?.id);

  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [nutritions, setNutritions] = useState<NutritionLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setWeights([]);
      setWorkouts([]);
      setNutritions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [w, wo, n] = await Promise.all([
        getWeightLogs(userId),
        getWorkoutLogs(userId),
        getNutritionLogs(userId),
      ]);

      setWeights(w || []);
      setWorkouts(wo || []);
      setNutritions(n || []);
    } catch (e) {
      console.error(e);
      setError("خطا در بارگذاری فعالیت‌ها");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh, refreshKey]);

  return {
    weights,
    workouts,
    nutritions,
    isLoading,
    error,
    refresh,
  };
}
