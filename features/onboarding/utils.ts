import type { UserProfile } from "@/lib/types/plan";

/**
 * آیا کاربر trainee است و هنوز onboarding را کامل نکرده؟
 */
export function needsOnboarding(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.role !== "trainee") return false;
  return !user.onboardingCompleted;
}

/**
 * مسیر مناسب بعد از login / register بر اساس نقش و وضعیت onboarding
 */
export function getPostAuthRedirect(user: UserProfile): string {
  if (user.role === "admin") return "/admin";
  if (user.role === "coach") return "/coach";
  if (user.role === "seller") return "/dashboard";

  // trainee
  if (needsOnboarding(user)) return "/onboarding";
  return "/dashboard";
}
