export type RoleFlowIntent = "role-selection" | "coach-apply" | "seller-apply";

const INTENT_KEY = "sepandtan:role-flow-intent";

export function setRoleFlowIntent(intent: RoleFlowIntent | null): void {
  if (typeof window === "undefined") return;
  if (!intent) {
    window.localStorage.removeItem(INTENT_KEY);
    return;
  }
  window.localStorage.setItem(INTENT_KEY, intent);
}

export function getRoleFlowIntent(): RoleFlowIntent | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(INTENT_KEY);
  if (v === "role-selection" || v === "coach-apply" || v === "seller-apply") {
    return v;
  }
  return null;
}

export function clearRoleFlowIntent(): void {
  setRoleFlowIntent(null);
}

export function isRoleFlowPath(pathname: string): boolean {
  const p = (pathname.split("?")[0] ?? pathname).replace(/\/$/, "") || "/";
  return (
    p === "/role-selection" ||
    p.startsWith("/role/") ||
    p.startsWith("/role-pending")
  );
}

type AuthUserLike = {
  role?: string | null;
  roleStatus?: string | null;
  onboardingCompleted?: boolean | null;
  onboardingStatus?: string | null;
  professionalRoleLock?: string | null;
  accountStatus?: string | null;
};

/**
 * مقصد امن بعد از login / refresh / باز شدن مجدد اپ.
 */
export function resolvePostAuthPath(
  user: AuthUserLike | null | undefined,
): string {
  if (!user) return "/login";

  const role = (user.role ?? "").toLowerCase();
  const status = (user.roleStatus ?? "").toLowerCase();

  if (user.accountStatus === "SUSPENDED") return "/login?reason=suspended";
  if (user.accountStatus === "DELETED") return "/login?reason=deleted";

  if (role === "admin" || role === "superadmin") return "/admin";

  // Professional approved
  if (role === "coach" && status === "approved") return "/coach";
  if ((role === "seller" || role === "store") && status === "approved") {
    return "/seller";
  }

  // Professional pending / rejected / suspended application
  if (
    (role === "coach" || role === "seller" || role === "store") &&
    status &&
    status !== "approved"
  ) {
    const type = role === "store" ? "seller" : role;
    return `/role-pending?type=${type}`;
  }

  // Mid role-flow (survives tab close)
  const intent = getRoleFlowIntent();
  if (intent === "coach-apply") return "/role/coach-apply";
  if (intent === "seller-apply") return "/role/seller-apply";
  if (intent === "role-selection") return "/role-selection";

  // Trainee onboarding
  const isTrainee = role === "trainee" || role === "user" || !role;
  const needsOnboarding =
    user.onboardingCompleted !== true && user.onboardingStatus !== "completed";

  if (isTrainee && needsOnboarding) {
    // هنوز role انتخاب نکرده → اول role-selection
    if (!role || role === "user") return "/role-selection";
    return "/onboarding";
  }

  return "/dashboard";
}
