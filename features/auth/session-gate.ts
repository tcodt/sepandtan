import { setAccessToken } from "@/lib/api/client";
import { useUserStore } from "@/lib/store/user-store";
import type { UserProfile } from "@/lib/types/plan";
import { getRoleMismatchRedirect } from "@/features/onboarding/utils";

export type SessionGateReason =
  | "suspended"
  | "deleted"
  | "session"
  | "seller_revoked"
  | "coach_revoked";

export type GateAction =
  | { type: "none" }
  | { type: "logout"; reason: SessionGateReason }
  | { type: "redirect"; href: string };

export function clearClientSession(): void {
  setAccessToken(null);
  useUserStore.getState().logout();
}

export function loginPathForReason(reason: SessionGateReason): string {
  return `/login?reason=${reason}`;
}

export function resolveSessionAction(input: {
  user: UserProfile;
  previousRole: string | null;
  pathname: string;
}): GateAction {
  const { user, previousRole, pathname } = input;

  if (user.accountStatus === "SUSPENDED") {
    return { type: "logout", reason: "suspended" };
  }
  if (user.accountStatus === "DELETED") {
    return { type: "logout", reason: "deleted" };
  }

  // demote فروشنده در حالی که روی /seller است
  if (
    (previousRole === "seller" || pathname.startsWith("/seller")) &&
    user.role !== "seller" &&
    user.role !== "admin"
  ) {
    return { type: "logout", reason: "seller_revoked" };
  }

  if (
    (previousRole === "coach" || pathname.startsWith("/coach")) &&
    user.role !== "coach" &&
    user.role !== "admin"
  ) {
    return { type: "logout", reason: "coach_revoked" };
  }

  // promote دوباره: STORE شده ولی هنوز onboarding/dashboard
  const mismatch = getRoleMismatchRedirect(user, pathname);
  if (mismatch) {
    if (mismatch.startsWith("/login?reason=")) {
      const reason = mismatch.split("reason=")[1] as SessionGateReason;
      return { type: "logout", reason };
    }
    return { type: "redirect", href: mismatch };
  }

  return { type: "none" };
}
