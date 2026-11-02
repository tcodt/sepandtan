"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { getMyProfile, isLoggedIn, logoutRequest } from "@/lib/api/auth";
import { mapProfileResponseToUser } from "@/lib/api/mappers/user";
import { useUserStore } from "@/lib/store/user-store";
import { getAccessToken, setAccessToken } from "@/lib/api/client";

export const PROFILE_QUERY_KEY = ["auth", "me"] as const;

export function useAuthHydration() {
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);
  const logout = useUserStore((s) => s.logout);
  const setHasHydrated = useUserStore((s) => s.setHasHydrated);
  const hasHydrated = useUserStore((s) => s._hasHydrated);
  const queryClient = useQueryClient();
  const didInit = useRef(false);

  const { data, isError, isFetched } = useQuery({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: getMyProfile,
    enabled: isLoggedIn() && hasHydrated,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!hasHydrated || didInit.current) return;

    if (!getAccessToken()) {
      setHasHydrated(true);
      didInit.current = true;
      return;
    }

    if (!isFetched) return;

    didInit.current = true;

    if (isError || !data) {
      setAccessToken(null);
      logout();
      queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY });
      return;
    }

    setAuthFromBackend(mapProfileResponseToUser(data));
  }, [
    hasHydrated,
    isFetched,
    isError,
    data,
    setAuthFromBackend,
    logout,
    setHasHydrated,
    queryClient,
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
