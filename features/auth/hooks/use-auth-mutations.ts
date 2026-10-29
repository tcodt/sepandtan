"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { loginRequest, registerRequest, logoutRequest } from "@/lib/api/auth";
import { mapAuthToUserProfile } from "@/lib/api/mappers/user";
import { getErrorMessage } from "@/lib/api/client";
import { useUserStore } from "@/lib/store/user-store";
import type { LoginDto, RegisterDto } from "@/lib/types/api";

export function useLoginMutation() {
  const router = useRouter();
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);

  return useMutation({
    mutationFn: (dto: LoginDto) => loginRequest(dto),
    onSuccess: (data) => {
      const user = mapAuthToUserProfile(data);
      setAuthFromBackend(user);
      toast.success("ورود موفق");

      // هدایت بر اساس نقش
      if (user.role === "admin") {
        router.replace("/admin");
      } else if (user.role === "coach") {
        router.replace("/coach");
      } else if (user.role === "seller") {
        router.replace("/dashboard"); // یا پنل فروشنده
      } else {
        router.replace("/dashboard");
      }
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ورود ناموفق بود"));
    },
  });
}

export function useRegisterMutation() {
  const router = useRouter();
  const setAuthFromBackend = useUserStore((s) => s.setAuthFromBackend);

  return useMutation({
    mutationFn: (dto: RegisterDto) => registerRequest(dto),
    onSuccess: (data) => {
      const user = mapAuthToUserProfile(data);
      setAuthFromBackend(user);
      toast.success("ثبت‌نام موفق");
      router.replace("/role-selection");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ثبت‌نام ناموفق بود"));
    },
  });
}

export function useLogoutMutation() {
  const router = useRouter();
  const logout = useUserStore((s) => s.logout);

  return useMutation({
    mutationFn: () => logoutRequest(),
    onSettled: () => {
      logout();
      router.replace("/login");
    },
  });
}
