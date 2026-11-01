"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  loginRequest,
  registerRequest,
  logoutRequest,
  getMyProfile,
} from "@/lib/api/auth";
import {
  mapAuthToUserProfile,
  mapProfileResponseToUser,
} from "@/lib/api/mappers/user";
import { getErrorMessage } from "@/lib/api/client";
import { useUserStore } from "@/lib/store/user-store";
import type { LoginDto, RegisterDto } from "@/lib/types/api";
import { getPostAuthRedirect } from "@/features/onboarding/utils";

const PROFILE_QUERY_KEY = ["auth", "me"] as const;

export function useLoginMutation() {
  const router = useRouter();
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: LoginDto) => {
      const auth = await loginRequest(dto);
      // بعد از login، profile کامل را بگیر
      try {
        const profile = await getMyProfile();
        return { auth, profile };
      } catch {
        return { auth, profile: null };
      }
    },
    onSuccess: ({ auth, profile }) => {
      const user = profile
        ? mapProfileResponseToUser(profile)
        : mapAuthToUserProfile(auth);

      setAuthFromBackend(user);
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile ?? undefined);
      toast.success("ورود موفق");
      router.replace(getPostAuthRedirect(user));
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ورود ناموفق بود"));
    },
  });
}

export function useRegisterMutation() {
  const router = useRouter();
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: RegisterDto) => {
      const auth = await registerRequest(dto);
      try {
        const profile = await getMyProfile();
        return { auth, profile };
      } catch {
        return { auth, profile: null };
      }
    },
    onSuccess: ({ auth, profile }) => {
      const user = profile
        ? mapProfileResponseToUser(profile)
        : mapAuthToUserProfile(auth);

      setAuthFromBackend(user);
      queryClient.setQueryData(PROFILE_QUERY_KEY, profile ?? undefined);
      toast.success("ثبت‌نام موفق");

      // بعد از ثبت‌نام معمولاً role-selection یا onboarding
      if (user.role === "trainee") {
        router.replace("/role-selection"); // یا مستقیم "/onboarding" اگر role-selection نداری
      } else {
        router.replace(getPostAuthRedirect(user));
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ثبت‌نام ناموفق بود"));
    },
  });
}

export function useLogoutMutation() {
  const router = useRouter();
  const logout = useUserStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logoutRequest(),
    onSettled: () => {
      logout();
      queryClient.removeQueries({ queryKey: PROFILE_QUERY_KEY });
      router.replace("/login");
    },
  });
}
