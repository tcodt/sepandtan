"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";

import { getMyProfile, logoutRequest } from "@/lib/api/auth";
import { mapProfileResponseToUser } from "@/lib/api/mappers/user";
import { useUserStore } from "@/lib/store/user-store";
import { getAccessToken } from "@/lib/api/client";
import {
  clearClientSession,
  loginPathForReason,
  resolveSessionAction,
} from "@/features/auth/session-gate";

export const PROFILE_QUERY_KEY = ["auth", "me"] as const;

export function useAuthHydration() {
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);
  const hasHydrated = useUserStore((s) => s._hasHydrated);
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const prevRoleRef = useRef<string | null>(null);
  const pathnameRef = useRef(pathname);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const token = typeof window !== "undefined" ? getAccessToken() : null;

  const { data, isError, isFetched, refetch } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getMyProfile,
    enabled: Boolean(hasHydrated && token),
    retry: false,
    staleTime: 8_000,
    refetchInterval: 10_000,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  useEffect(() => {
    if (!hasHydrated || !token) return;
    const bounce = () => {
      if (document.visibilityState === "visible") void refetch();
    };
    document.addEventListener("visibilitychange", bounce);
    window.addEventListener("focus", bounce);
    return () => {
      document.removeEventListener("visibilitychange", bounce);
      window.removeEventListener("focus", bounce);
    };
  }, [hasHydrated, token, refetch]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!getAccessToken()) return;
    if (!isFetched) return;

    if (isError || !data) {
      clearClientSession();
      queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY });
      router.replace(loginPathForReason("session"));
      return;
    }

    const mapped = mapProfileResponseToUser(data);
    const previousRole = prevRoleRef.current;
    const action = resolveSessionAction({
      user: mapped,
      previousRole,
      pathname: pathnameRef.current,
    });

    prevRoleRef.current = mapped.role;

    if (action.type === "logout") {
      clearClientSession();
      queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY });
      router.replace(loginPathForReason(action.reason));
      return;
    }

    setAuthFromBackend(mapped);

    if (action.type === "redirect") {
      router.replace(action.href);
    }
  }, [
    hasHydrated,
    isFetched,
    isError,
    data,
    setAuthFromBackend,
    queryClient,
    router,
  ]);
}

export function useAuth() {
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const hasHydrated = useUserStore((s) => s._hasHydrated);
  const logoutStore = useUserStore((s) => s.logout);
  const queryClient = useQueryClient();
  const router = useRouter();

  const logout = async () => {
    try {
      await logoutRequest();
    } finally {
      logoutStore();
      queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY });
      router.replace("/login");
    }
  };

  return {
    user,
    isAuthenticated,
    isReady: hasHydrated,
    isLoading: !hasHydrated,
    logout,
  };
}

export { useRequireAuth } from "@/hooks/use-require-auth";
