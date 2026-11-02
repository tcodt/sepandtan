import { updateMyProfile } from "@/lib/api/auth";
import { mapOnboardingToUpdateProfileDto } from "@/lib/api/mappers/user";
import type { BodyInfo, Equipment, Goal } from "@/lib/types/plan";
import type { UserProfileResponseDto } from "@/lib/types/api";

export type CompleteOnboardingPayload = {
  bodyInfo: BodyInfo;
  equipment: Equipment;
  goal: Goal;
  targetWeight?: number;
  currentPlanId?: string;
};

export async function saveOnboardingToBackend(
  payload: CompleteOnboardingPayload,
): Promise<UserProfileResponseDto> {
  const dto = mapOnboardingToUpdateProfileDto({
    bodyInfo: payload.bodyInfo,
    equipment: payload.equipment,
    goal: payload.goal,
    targetWeight: payload.targetWeight,
  });

  return updateMyProfile(dto);
}
