"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  saveOnboardingToBackend,
  type CompleteOnboardingPayload,
} from "../api";
import { mapProfileResponseToUser } from "@/lib/api/mappers/user";
import { getErrorMessage } from "@/lib/api/client";
import { useUserStore } from "@/lib/store/user-store";

const PROFILE_QUERY_KEY = ["auth", "me"] as const;

export function useCompleteOnboarding() {
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);
  const completeOnboardingLocal = useUserStore((s) => s.completeOnboarding);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CompleteOnboardingPayload) =>
      saveOnboardingToBackend(payload),
    onSuccess: (profileRes, variables) => {
      const user = mapProfileResponseToUser(profileRes);

      // اگر بک‌اند هنوز body را برنگرداند، محلی کامل کن
      const ensured: typeof user = {
        ...user,
        bodyInfo: user.bodyInfo ?? variables.bodyInfo,
        equipment: user.equipment ?? variables.equipment,
        goal: variables.goal,
        targetWeight: variables.targetWeight ?? user.targetWeight,
        onboardingCompleted: true,
        onboardingStatus: "completed",
        currentOnboardingStep: 0,
        currentPlanId: variables.currentPlanId ?? user.currentPlanId ?? null,
      };

      setAuthFromBackend(ensured);
      queryClient.setQueryData(PROFILE_QUERY_KEY, profileRes);

      completeOnboardingLocal({
        bodyInfo: variables.bodyInfo,
        equipment: variables.equipment,
        goal: variables.goal,
        currentPlanId: variables.currentPlanId ?? "",
        targetWeight: variables.targetWeight,
      });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ذخیره اطلاعات ناموفق بود"));
    },
  });
}
