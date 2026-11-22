import type { UserProfile } from "@/lib/types/plan";
import {
  getRoleFlowIntent,
  type RoleFlowIntent,
} from "@/lib/auth/resolve-post-auth-path";

/** مسیرهایی که فقط برای trainee (بدون قفل حرفه‌ای) معنا دارند */
const TRAINEE_FITNESS_PREFIXES = ["/onboarding", "/dashboard"] as const;

/** مسیرهای flow انتخاب نقش / درخواست حرفه‌ای */
const ROLE_FLOW_PREFIXES = [
  "/role-selection",
  "/role/coach-apply",
  "/role/seller-apply",
  "/role-pending",
] as const;

function pathStartsWithAny(path: string, prefixes: readonly string[]): boolean {
  return prefixes.some(
    (p) => path === p || path.startsWith(`${p}/`) || path.startsWith(p),
  );
}

function intentToPath(intent: RoleFlowIntent): string {
  switch (intent) {
    case "coach-apply":
      return "/role/coach-apply";
    case "seller-apply":
      return "/role/seller-apply";
    case "role-selection":
    default:
      return "/role-selection";
  }
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

/**
 * مسیر خانه صرفاً بر اساس role (fallback).
 * ترجیحاً از getCanonicalPathForUser / getPostAuthRedirect استفاده کن.
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
 * مقصد canonical کاربر بر اساس نقش + وضعیت + intent role-flow.
 * این تابع جلوی پرتاب اشتباه به /onboarding را می‌گیرد.
 */
export function getCanonicalPathForUser(user: UserProfile): string {
  if (user.accountStatus === "SUSPENDED") return "/login?reason=suspended";
  if (user.accountStatus === "DELETED") return "/login?reason=deleted";

  if (user.role === "admin") return "/admin";

  if (user.role === "coach") {
    if (user.roleStatus && user.roleStatus !== "approved") {
      return "/role-pending?type=coach";
    }
    return "/coach";
  }

  if (user.role === "seller") {
    if (user.roleStatus && user.roleStatus !== "approved") {
      return "/role-pending?type=seller";
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

  // وسط role-flow (تب بسته / برگشت) → همان flow
  const intent = getRoleFlowIntent();
  if (intent) {
    return intentToPath(intent);
  }

  // trainee بدون intent
  if (needsOnboarding(user)) return "/onboarding";
  return "/dashboard";
}

export function getPostAuthRedirect(user: UserProfile): string {
  return getCanonicalPathForUser(user);
}

/**
 * بعد از ثبت‌نام:
 * - نقش حرفه‌ای → پنل / pending
 * - در غیر این صورت همیشه role-selection (نه onboarding مستقیم)
 */
export function getPostRegisterRedirect(user: UserProfile): string {
  if (user.role === "admin") return "/admin";

  if (user.role === "coach") {
    return user.roleStatus === "approved"
      ? "/coach"
      : "/role-pending?type=coach";
  }

  if (user.role === "seller") {
    return user.roleStatus === "approved"
      ? "/seller"
      : "/role-pending?type=seller";
  }

  // trainee تازه‌ثبت‌نام → انتخاب مسیر
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

  if (user.accountStatus === "SUSPENDED" || user.accountStatus === "DELETED") {
    return getCanonicalPathForUser(user);
  }

  const onTraineeFitness = pathStartsWithAny(path, TRAINEE_FITNESS_PREFIXES);
  const onRoleFlow = pathStartsWithAny(path, ROLE_FLOW_PREFIXES);

  // —— Seller تأییدشده ——
  if (user.role === "seller" && user.roleStatus === "approved") {
    if (onTraineeFitness || onRoleFlow || path.startsWith("/coach")) {
      return "/seller";
    }
  }

  // —— Seller pending ——
  if (
    user.role === "seller" &&
    user.roleStatus &&
    user.roleStatus !== "approved"
  ) {
    if (
      onTraineeFitness ||
      path.startsWith("/seller") ||
      path === "/role-selection" ||
      path.startsWith("/role/coach-apply") ||
      path.startsWith("/role/seller-apply")
    ) {
      return "/role-pending?type=seller";
    }
  }

  // —— Coach تأییدشده ——
  if (user.role === "coach" && user.roleStatus === "approved") {
    if (onTraineeFitness || onRoleFlow || path.startsWith("/seller")) {
      return "/coach";
    }
  }

  // —— Coach pending ——
  if (
    user.role === "coach" &&
    user.roleStatus &&
    user.roleStatus !== "approved"
  ) {
    if (
      onTraineeFitness ||
      path.startsWith("/coach") ||
      path === "/role-selection" ||
      path.startsWith("/role/coach-apply") ||
      path.startsWith("/role/seller-apply")
    ) {
      return "/role-pending?type=coach";
    }
  }

  // —— Admin ——
  if (user.role === "admin") {
    if (path.startsWith("/onboarding") || path.startsWith("/role-selection")) {
      return "/admin";
    }
  }

  // —— پنل فروشنده بدون نقش ——
  if (
    path.startsWith("/seller") &&
    user.role !== "seller" &&
    user.role !== "admin"
  ) {
    return "/login?reason=seller_revoked";
  }

  // —— پنل مربی بدون نقش ——
  if (
    path.startsWith("/coach") &&
    user.role !== "coach" &&
    user.role !== "admin"
  ) {
    return "/login?reason=coach_revoked";
  }

  // —— Trainee با قفل حرفه‌ای: onboarding ممنوع ——
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

  // —— Trainee وسط role-flow: onboarding ممنوع ——
  // اگر intent دارد و الان روی onboarding است → برگردان به flow
  if (user.role === "trainee" && path.startsWith("/onboarding")) {
    const intent = getRoleFlowIntent();
    if (intent) return intentToPath(intent);
  }

  // role-selection / apply برای trainee (یا user تازه‌وارد) مجاز است
  if (
    user.role === "trainee" &&
    (path === "/role-selection" ||
      path.startsWith("/role/coach-apply") ||
      path.startsWith("/role/seller-apply"))
  ) {
    return null;
  }

  return null;
}
