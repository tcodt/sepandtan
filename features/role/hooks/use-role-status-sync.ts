"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { getMyProfile } from "@/lib/api/auth";
import { mapProfileResponseToUser } from "@/lib/api/mappers/user";
import { useUserStore } from "@/lib/store/user-store";
import type { UserProfile } from "@/lib/types/plan";

export type RoleSyncState = "pending" | "approved" | "rejected" | "suspended";

function resolveSyncState(user: UserProfile): RoleSyncState {
  if (user.roleStatus === "pending") return "pending";
  if (user.roleStatus === "rejected") return "rejected";
  if (user.roleStatus === "suspended") return "suspended";
  if (user.role === "coach" || user.role === "seller") return "approved";
  return "approved";
}

function resolveRedirect(
  user: UserProfile,
  state: RoleSyncState,
): string | null {
  if (state !== "approved") return null;

  if (user.role === "coach") return "/coach";
  if (user.role === "seller") return "/dashboard";
  if (user.role === "admin") return "/admin";
  if (user.role === "trainee") {
    return user.onboardingCompleted || user.onboardingStatus === "completed"
      ? "/dashboard"
      : "/onboarding";
  }
  return "/dashboard";
}

/** مقایسه سبک برای جلوگیری از setState تکراری */
function isSameAuthUser(a: UserProfile | null, b: UserProfile): boolean {
  if (!a) return false;
  return (
    a.id === b.id &&
    a.role === b.role &&
    a.roleStatus === b.roleStatus &&
    a.onboardingCompleted === b.onboardingCompleted &&
    a.onboardingStatus === b.onboardingStatus
  );
}

function mergeWithLocalPending(
  mapped: UserProfile,
  local: UserProfile | null,
): UserProfile {
  // بک‌اند نقش coach/seller داده → تأیید شده
  if (mapped.role === "coach" || mapped.role === "seller") {
    return { ...mapped, roleStatus: "approved" };
  }

  // بک‌اند هنوز trainee است ولی محلی pending داریم
  if (
    local &&
    local.roleStatus === "pending" &&
    (local.role === "coach" || local.role === "seller") &&
    mapped.role === "trainee"
  ) {
    return {
      ...mapped,
      role: local.role,
      roles: [local.role],
      roleStatus: "pending",
    };
  }

  return mapped;
}

export function useRoleStatusSync(enabled: boolean) {
  const router = useRouter();
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);

  // برای جلوگیری از redirect تکراری
  const didRedirectRef = useRef(false);
  // آخرین snapshot همگام‌شده
  const lastSyncedKeyRef = useRef<string>("");

  const query = useQuery({
    queryKey: ["role-status-sync"],
    queryFn: getMyProfile,
    enabled,
    refetchInterval: 8_000,
    refetchOnWindowFocus: true,
    staleTime: 0,
    retry: 1,
  });

  useEffect(() => {
    if (!query.data) return;

    const mapped = mapProfileResponseToUser(query.data);
    // local را یک‌بار از store بخوان (dependency نباشد)
    const local = useUserStore.getState().user;
    const merged = mergeWithLocalPending(mapped, local);

    const syncKey = `${merged.id}|${merged.role}|${merged.roleStatus}|${merged.onboardingStatus}`;

    // اگر تغییری نسبت به آخرین sync نیست → هیچ setState نزن
    if (lastSyncedKeyRef.current === syncKey) {
      return;
    }

    const current = useUserStore.getState().user;
    if (!isSameAuthUser(current, merged)) {
      setAuthFromBackend(merged);
    }

    lastSyncedKeyRef.current = syncKey;

    const state = resolveSyncState(merged);

    if (state === "approved" && !didRedirectRef.current) {
      const href = resolveRedirect(merged, state);
      if (href) {
        didRedirectRef.current = true;
        const t = window.setTimeout(() => {
          router.replace(href);
        }, 1800);
        return () => window.clearTimeout(t);
      }
    }
  }, [query.data, setAuthFromBackend, router]);

  // state برای UI — از store فعلی + آخرین query
  const storeUser = useUserStore((s) => s.user);
  const syncState: RoleSyncState = storeUser
    ? resolveSyncState(storeUser)
    : "pending";

  return {
    isChecking: query.isFetching,
    syncState,
    user: storeUser,
    refetch: query.refetch,
  };
}
