"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  saveOnboardingToBackend,
  type CompleteOnboardingPayload,
} from "../api";
import { mapProfileResponseToUser } from "@/lib/api/mappers/user";
import { getErrorMessage } from "@/lib/api/client";
import { useUserStore } from "@/lib/store/user-store";

export function useCompleteOnboarding() {
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);
  const completeOnboardingLocal = useUserStore((s) => s.completeOnboarding);

  return useMutation({
    mutationFn: (payload: CompleteOnboardingPayload) =>
      saveOnboardingToBackend(payload),
    onSuccess: (profileRes, variables) => {
      const user = mapProfileResponseToUser(profileRes);
      setAuthFromBackend(user);

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
