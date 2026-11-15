import type { UserProfile } from "@/lib/types/plan";

/** مسیرهایی که فقط برای trainee (بدون قفل حرفه‌ای) معنا دارند */
const TRAINEE_FITNESS_PREFIXES = [
  "/onboarding",
  "/dashboard",
  "/role-selection",
] as const;

function pathStartsWithAny(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (p) => path === p || path.startsWith(`${p}/`) || path.startsWith(p),
  );
}

export function needsOnboarding(user: UserProfile | null | undefined): boolean {
  if (!user) return false;
  if (user.role !== "trainee") return false;
  if (
    user.professionalRoleLock === "seller" ||
    user.professionalRoleLock === "coach"
  ) {
    return false;
  }
  return !(user.onboardingCompleted || user.onboardingStatus === "completed");
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

  // trainee با قفل سابق فروشنده/مربی — نه onboarding
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

/**
 * اگر کاربر روی path اشتباه نسبت به نقش سرور باشد → مسیر درست
 * null = مجاز است بماند
 */
export function getRoleMismatchRedirect(
  user: UserProfile,
  pathname: string,
): string | null {
  const path = pathname.split("?")[0] || pathname;

  // مسیرهای عمومی مارکت / سایت
  if (
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/register") ||
    path.startsWith("/store") ||
    path.startsWith("/cart") ||
    path.startsWith("/wishlist") ||
    path.startsWith("/account") ||
    path.startsWith("/settings") ||
    path.startsWith("/about") ||
    path.startsWith("/contact") ||
    path.startsWith("/products")
  ) {
    // account برای همه نقش‌ها مجاز است
    // استثنا: پایین‌تر برای seller روی fitness چک می‌شود
  }

  if (user.accountStatus === "SUSPENDED" || user.accountStatus === "DELETED") {
    return getCanonicalPathForUser(user);
  }

  const onTraineeFitness = pathStartsWithAny(path, TRAINEE_FITNESS_PREFIXES);

  // —— Seller تأییدشده: پنل خودش؛ نه dashboard/onboarding ——
  if (user.role === "seller" && user.roleStatus === "approved") {
    if (
      onTraineeFitness ||
      path.startsWith("/role-pending") ||
      path.startsWith("/coach")
    ) {
      return "/seller";
    }
  }

  // —— Seller pending ——
  if (
    user.role === "seller" &&
    user.roleStatus &&
    user.roleStatus !== "approved"
  ) {
    if (onTraineeFitness || path.startsWith("/seller")) {
      return "/role-pending";
    }
  }

  // —— Coach تأییدشده ——
  if (user.role === "coach" && user.roleStatus === "approved") {
    if (
      onTraineeFitness ||
      path.startsWith("/role-pending") ||
      path.startsWith("/seller")
    ) {
      return "/coach";
    }
  }

  // —— Coach pending ——
  if (
    user.role === "coach" &&
    user.roleStatus &&
    user.roleStatus !== "approved"
  ) {
    if (onTraineeFitness || path.startsWith("/coach")) {
      return "/role-pending";
    }
  }

  // —— Admin ——
  if (user.role === "admin") {
    if (path.startsWith("/onboarding") || path.startsWith("/role-selection")) {
      return "/admin";
    }
  }

  // —— دسترسی به پنل فروشنده بدون نقش ——
  if (
    path.startsWith("/seller") &&
    user.role !== "seller" &&
    user.role !== "admin"
  ) {
    return "/login?reason=seller_revoked";
  }

  // —— دسترسی به پنل مربی بدون نقش ——
  if (
    path.startsWith("/coach") &&
    user.role !== "coach" &&
    user.role !== "admin"
  ) {
    return "/login?reason=coach_revoked";
  }

  // —— Trainee با قفل seller: onboarding ممنوع ——
  if (
    user.role === "trainee" &&
    user.professionalRoleLock === "seller" &&
    path.startsWith("/onboarding")
  ) {
    return "/dashboard?notice=seller_revoked";
  }

  if (
    user.role === "trainee" &&
    user.professionalRoleLock === "coach" &&
    path.startsWith("/onboarding")
  ) {
    return "/dashboard?notice=coach_revoked";
  }

  return null;
}
