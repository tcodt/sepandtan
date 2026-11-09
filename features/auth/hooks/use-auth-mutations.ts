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
import { getErrorMessage, setAccessToken } from "@/lib/api/client";
import { useUserStore } from "@/lib/store/user-store";
import type { LoginDto, RegisterDto } from "@/lib/types/api";
import {
  getPostAuthRedirect,
  getPostRegisterRedirect,
} from "@/features/onboarding/utils";
import { PROFILE_QUERY_KEY } from "./use-auth";

function blockIfInactive(status: string | undefined | null): string | null {
  if (status === "SUSPENDED") return "حساب شما معلق است و امکان ورود ندارید.";
  if (status === "DELETED") return "حساب شما حذف شده است.";
  return null;
}

export function useLoginMutation() {
  const router = useRouter();
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);
  const logoutStore = useUserStore((s) => s.logout);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: LoginDto) => {
      const auth = await loginRequest(dto);

      // اگر توکن نبود ولی cookie-session است، profile را امتحان کن
      let profile = null;
      try {
        profile = await getMyProfile();
      } catch (e) {
        // بدون توکن profile fail می‌شود
        throw e;
      }

      return { auth, profile };
    },
    onSuccess: ({ auth, profile }) => {
      const status = profile?.status ?? auth.status;
      const blocked = blockIfInactive(status);
      if (blocked) {
        setAccessToken(null);
        logoutStore();
        toast.error(blocked);
        router.replace(
          status === "SUSPENDED"
            ? "/login?reason=suspended"
            : "/login?reason=deleted",
        );
        return;
      }

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
      let profile = null;
      try {
        profile = await getMyProfile();
      } catch {
        // ثبت‌نام ممکن است بدون auto-login باشد
      }
      return { auth, profile };
    },
    onSuccess: ({ auth, profile }) => {
      if (!auth.accessToken && !auth.token && !profile) {
        toast.success("ثبت‌نام انجام شد؛ وارد شوید");
        router.replace("/login");
        return;
      }

      const user = profile
        ? mapProfileResponseToUser(profile)
        : mapAuthToUserProfile(auth);

      setAuthFromBackend(user);
      if (profile) queryClient.setQueryData(PROFILE_QUERY_KEY, profile);
      toast.success("ثبت‌نام موفق");
      router.replace(getPostRegisterRedirect(user));
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
