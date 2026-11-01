"use client";

import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { getMyProfile, isLoggedIn, logoutRequest } from "@/lib/api/auth";
import { mapProfileResponseToUser } from "@/lib/api/mappers/user";
import { useUserStore } from "@/lib/store/user-store";
import { getAccessToken, setAccessToken } from "@/lib/api/client";

const PROFILE_QUERY_KEY = ["auth", "me"] as const;

/**
 * Hydrate و مدیریت session
 * این hook را یک‌بار در AuthProvider یا layout اصلی صدا بزنید.
 */
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
    staleTime: 5 * 60 * 1000, // 5 دقیقه
  });

  useEffect(() => {
    if (!hasHydrated || didInit.current) return;

    // اگر token نداریم → فوراً hydrated در نظر بگیر
    if (!getAccessToken()) {
      setHasHydrated(true);
      didInit.current = true;
      return;
    }

    // منتظر نتیجه query می‌مانیم
    if (!isFetched) return;

    didInit.current = true;

    if (isError || !data) {
      setAccessToken(null);
      logout();
      queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY });
      return;
    }

    const user = mapProfileResponseToUser(data);
    setAuthFromBackend(user);
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

/**
 * دسترسی ساده به وضعیت auth
 */
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

/**
 * Guard برای صفحات محافظت‌شده
 * استفاده: const { user, isReady } = useRequireAuth({ roles: ["admin"] })
 */
export function useRequireAuth(options?: {
  roles?: Array<"trainee" | "coach" | "seller" | "admin">;
  redirectTo?: string;
}) {
  const { user, isAuthenticated, isReady } = useAuth();
  const router = useRouter();
  const redirectTo = options?.redirectTo ?? "/login";

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated || !user) {
      router.replace(redirectTo);
      return;
    }

    if (options?.roles && !options.roles.includes(user.role)) {
      // نقش مجاز نیست
      if (user.role === "admin") router.replace("/admin");
      else if (user.role === "coach") router.replace("/coach");
      else router.replace("/dashboard");
    }
  }, [isReady, isAuthenticated, user, options?.roles, redirectTo, router]);

  return {
    user,
    isReady,
    isAuthenticated: isAuthenticated && Boolean(user),
  };
}
