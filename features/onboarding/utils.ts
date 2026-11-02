import type { UserProfile } from "@/lib/types/plan";

export function needsOnboarding(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.role !== "trainee") return false;
  return !user.onboardingCompleted;
}

/**
 * مسیر خانه هر نقش (برای guard و fallback)
 */
export function getHomePathForRole(role: UserProfile["role"]): string {
  switch (role) {
    case "admin":
      return "/admin";
    case "coach":
      return "/coach";
    case "seller":
      return "/seller";
    default:
      return "/dashboard";
  }
}

/**
 * بعد از login — بر اساس نقش و status
 * Seller تأییدشده → /seller (نه /dashboard)
 */
export function getPostAuthRedirect(user: UserProfile): string {
  if (user.role === "admin") return "/admin";

  if (user.role === "coach") {
    if (user.roleStatus && user.roleStatus !== "approved") {
      return "/role-pending";
    }
    return "/coach";
  }

  if (user.role === "seller") {
    if (user.roleStatus && user.roleStatus !== "approved") {
      return "/role-pending";
    }
    return "/seller";
  }

  if (needsOnboarding(user)) return "/onboarding";
  return "/dashboard";
}

/**
 * بعد از register — معمولاً انتخاب نقش یا onboarding
 * (export مورد نیاز use-auth-mutations)
 */
export function getPostRegisterRedirect(user: UserProfile): string {
  // کاربر تازه‌ثبت‌نام معمولاً trainee است
  if (user.role === "admin") return "/admin";
  if (user.role === "coach") {
    return user.roleStatus === "approved" ? "/coach" : "/role-pending";
  }
  if (user.role === "seller") {
    return user.roleStatus === "approved" ? "/seller" : "/role-pending";
  }

  // trainee: اگر هنوز نقش تخصصی انتخاب نشده → role-selection
  // اگر onboarding لازم است همان مسیر auth
  if (needsOnboarding(user)) {
    // بعضی فلوها اول role-selection می‌خواهند
    return "/role-selection";
  }

  return "/role-selection";
}
