import type { UserProfile } from "@/lib/types/plan";

export function needsOnboarding(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.role !== "trainee") return false;
  if (
    user.professionalRoleLock === "seller" ||
    user.professionalRoleLock === "coach"
  ) {
    return false;
  }
  return !user.onboardingCompleted;
}

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

export function getCanonicalPathForUser(user: UserProfile): string {
  if (user.accountStatus === "SUSPENDED") return "/login?reason=suspended";
  if (user.accountStatus === "DELETED") return "/login?reason=deleted";

  if (user.role === "admin") return "/admin";

  if (user.role === "coach") {
    if (user.roleStatus && user.roleStatus !== "approved")
      return "/role-pending";
    return "/coach";
  }

  if (user.role === "seller") {
    if (user.roleStatus && user.roleStatus !== "approved")
      return "/role-pending";
    return "/seller";
  }

  if (user.professionalRoleLock === "seller") {
    return "/dashboard?notice=seller_revoked";
  }
  if (user.professionalRoleLock === "coach") {
    return "/dashboard?notice=coach_revoked";
  }

  if (needsOnboarding(user)) return "/onboarding";
  return "/dashboard";
}

export function getPostAuthRedirect(user: UserProfile): string {
  return getCanonicalPathForUser(user);
}

export function getPostRegisterRedirect(user: UserProfile): string {
  if (user.role === "admin") return "/admin";
  if (user.role === "coach") {
    return user.roleStatus === "approved" ? "/coach" : "/role-pending";
  }
  if (user.role === "seller") {
    return user.roleStatus === "approved" ? "/seller" : "/role-pending";
  }
  return "/role-selection";
}

/** مسیر اشتباه نسبت به نقش فعلی سرور */
export function getRoleMismatchRedirect(
  user: UserProfile,
  pathname: string,
): string | null {
  const path = pathname.split("?")[0] || pathname;

  if (
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/store") ||
    path === "/" ||
    path.startsWith("/products")
  ) {
    return null;
  }

  if (user.accountStatus === "SUSPENDED" || user.accountStatus === "DELETED") {
    return getCanonicalPathForUser(user);
  }

  if (user.role === "seller" && user.roleStatus === "approved") {
    if (
      path.startsWith("/onboarding") ||
      path.startsWith("/dashboard") ||
      path.startsWith("/role-selection") ||
      path.startsWith("/role-pending")
    ) {
      return "/seller";
    }
  }

  if (user.role === "coach" && user.roleStatus === "approved") {
    if (
      path.startsWith("/onboarding") ||
      path.startsWith("/dashboard") ||
      path.startsWith("/role-selection") ||
      path.startsWith("/seller")
    ) {
      return "/coach";
    }
  }

  if (user.role === "admin") {
    if (path.startsWith("/onboarding") || path.startsWith("/seller")) {
      return "/admin";
    }
  }

  if (
    path.startsWith("/seller") &&
    user.role !== "seller" &&
    user.role !== "admin"
  ) {
    return "/login?reason=seller_revoked";
  }

  if (
    path.startsWith("/coach") &&
    user.role !== "coach" &&
    user.role !== "admin"
  ) {
    return "/login?reason=coach_revoked";
  }

  if (
    user.role === "trainee" &&
    user.professionalRoleLock === "seller" &&
    path.startsWith("/onboarding")
  ) {
    return "/dashboard?notice=seller_revoked";
  }

  return null;
}
