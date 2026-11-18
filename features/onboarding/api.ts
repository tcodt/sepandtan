import { apiClient } from "@/lib/api/client";
import { updateMyProfile } from "@/lib/api/auth";
import { mapOnboardingToUpdateProfileDto } from "@/lib/api/mappers/user";
import { asArray, asString } from "@/features/catalog/utils";
import type { BodyInfo, Equipment, Goal } from "@/lib/types/plan";
import type { UpdateProfileDto, UserProfileResponseDto } from "@/lib/types/api";

export type OnboardingStepBackend =
  | "PROFILE"
  | "EQUIPMENT"
  | "TRAINING_GOAL"
  | "DONE";

export type CompleteOnboardingPayload = {
  bodyInfo: BodyInfo;
  equipment: Equipment;
  goal: Goal;
  targetWeight?: number;
  trainingGoalId?: string;
};

export type TrainingGoalOption = {
  id: string;
  name: string;
  slug: string | null;
};

function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const root = (data ?? {}) as Record<string, unknown>;
  for (const key of ["goals", "data", "items", "results", "list"]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }
  return asArray(data);
}

/** GET /catalog/training-goal/selector (fallback: /catalog/training-goal) */
export async function fetchTrainingGoals(): Promise<TrainingGoalOption[]> {
  const mapRows = (data: unknown): TrainingGoalOption[] =>
    extractList(data)
      .map((raw) => {
        const r = (raw ?? {}) as Record<string, unknown>;
        const id = asString(r.id);
        const name = asString(r.name) ?? asString(r.title);
        if (!id || !name) return null;
        return { id, name, slug: asString(r.slug) };
      })
      .filter((x): x is TrainingGoalOption => x !== null);

  try {
    const { data } = await apiClient.get("/catalog/training-goal/selector");
    return mapRows(data);
  } catch {
    const { data } = await apiClient.get("/catalog/training-goal");
    return mapRows(data);
  }
}

export function resolveTrainingGoalId(
  goal: Goal,
  options: TrainingGoalOption[],
): string | undefined {
  if (!options.length) return undefined;

  const keywords: Record<Goal, string[]> = {
    lose_weight: ["lose", "weight", "fat", "کاهش", "لاغر", "چربی"],
    build_muscle: ["muscle", "hypertrophy", "عضله", "حجم", "mass"],
    maintain: ["maintain", "ثبات", "حفظ"],
    endurance: ["endurance", "استقامت", "cardio", "قلبی"],
    general_fitness: ["general", "fitness", "عمومی", "تناسب", "سلامت"],
  };

  const keys = keywords[goal] ?? [];
  const found = options.find((o) => {
    const hay = `${o.name} ${o.slug ?? ""}`.toLowerCase();
    return keys.some((k) => hay.includes(k.toLowerCase()));
  });

  return found?.id ?? options[0]?.id;
}

/** PATCH /user/profile/onboarding */
export async function patchOnboardingStep(
  onBoardingStep: OnboardingStepBackend,
): Promise<void> {
  await apiClient.patch("/user/profile/onboarding", { onBoardingStep });
}

export async function saveOnboardingProfile(
  payload: CompleteOnboardingPayload,
): Promise<UserProfileResponseDto> {
  const dto: UpdateProfileDto = mapOnboardingToUpdateProfileDto({
    bodyInfo: payload.bodyInfo,
    equipment: payload.equipment,
    goal: payload.goal,
    targetWeight: payload.targetWeight,
    trainingGoalId: payload.trainingGoalId,
  });

  return updateMyProfile(dto);
}

/**
 * 1) PUT /user/profile
 * 2) PATCH onboarding → DONE
 * No local generatePlan.
 */
export async function completeOnboardingOnBackend(
  payload: CompleteOnboardingPayload,
): Promise<UserProfileResponseDto> {
  // Profile is the source of truth
  const profile = await saveOnboardingProfile(payload);

  // Steps are best-effort — never fail the whole flow if profile saved
  for (const step of [
    "PROFILE",
    "EQUIPMENT",
    "TRAINING_GOAL",
    "DONE",
  ] as const) {
    try {
      await patchOnboardingStep(step);
    } catch (e) {
      console.warn("[onboarding step]", step, e);
    }
  }

  try {
    const { getMyProfile } = await import("@/lib/api/auth");
    return await getMyProfile();
  } catch {
    return profile;
  }
}

/** alias برای سازگاری با importهای قبلی */
export async function saveOnboardingToBackend(
  payload: CompleteOnboardingPayload,
): Promise<UserProfileResponseDto> {
  return completeOnboardingOnBackend(payload);
}
