"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchCurrentUserPlan,
  fetchMyUserPlans,
  fetchUserPlanDiet,
  fetchUserPlanWorkout,
} from "./api";

export const userPlanKeys = {
  all: ["user-plan"] as const,
  current: () => [...userPlanKeys.all, "current"] as const,
  my: () => [...userPlanKeys.all, "my"] as const,
  workout: (planId: string) =>
    [...userPlanKeys.all, "workout", planId] as const,
  diet: (planId: string) => [...userPlanKeys.all, "diet", planId] as const,
};

export function useCurrentUserPlan(enabled = true) {
  return useQuery({
    queryKey: userPlanKeys.current(),
    queryFn: fetchCurrentUserPlan,
    enabled,
    staleTime: 15_000,
  });
}

export function useMyUserPlans(enabled = true) {
  return useQuery({
    queryKey: userPlanKeys.my(),
    queryFn: fetchMyUserPlans,
    enabled,
    staleTime: 30_000,
  });
}

export function useUserPlanWorkout(
  planId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: userPlanKeys.workout(planId ?? ""),
    queryFn: () => fetchUserPlanWorkout(planId!),
    enabled: Boolean(planId) && enabled,
    staleTime: 30_000,
  });
}

export function useUserPlanDiet(
  planId: string | null | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: userPlanKeys.diet(planId ?? ""),
    queryFn: () => fetchUserPlanDiet(planId!),
    enabled: Boolean(planId) && enabled,
    staleTime: 30_000,
  });
}
