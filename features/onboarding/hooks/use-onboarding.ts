"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/api/client";
import { PROFILE_QUERY_KEY } from "@/features/auth/hooks/use-auth";
import { useUserStore } from "@/lib/store/user-store";
import { mapProfileResponseToUser } from "@/lib/api/mappers/user";
import {
  completeOnboardingOnBackend,
  fetchTrainingGoals,
  resolveTrainingGoalId,
  type CompleteOnboardingPayload,
} from "../api";

export function useTrainingGoals() {
  return useQuery({
    queryKey: ["catalog", "training-goals"],
    queryFn: fetchTrainingGoals,
    staleTime: 5 * 60_000,
  });
}

export function useCompleteOnboarding() {
  const qc = useQueryClient();
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);

  return useMutation({
    mutationFn: async (payload: CompleteOnboardingPayload) => {
      let trainingGoalId = payload.trainingGoalId;
      if (!trainingGoalId) {
        try {
          const goals = await fetchTrainingGoals();
          trainingGoalId = resolveTrainingGoalId(payload.goal, goals);
        } catch {
          // catalog optional
        }
      }

      return completeOnboardingOnBackend({
        ...payload,
        trainingGoalId,
      });
    },
    onSuccess: (profile) => {
      const mapped = mapProfileResponseToUser(profile);
      setAuthFromBackend(mapped);
      void qc.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
      toast.success("اطلاعات ذخیره شد");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ذخیره اطلاعات ناموفق بود"));
    },
  });
}
