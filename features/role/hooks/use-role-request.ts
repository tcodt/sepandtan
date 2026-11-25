"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  attachCoachSpecialties,
  requestCoachRole,
  requestStoreRole,
} from "../api";
import type { CreateCoachPayload, CreateStorePayload } from "../types";
import { getErrorMessage } from "@/lib/api/client";
import { useUserStore } from "@/lib/store/user-store";
import { clearRoleFlowIntent } from "@/lib/auth/resolve-post-auth-path";
import { PROFILE_QUERY_KEY } from "@/features/auth/hooks/use-auth";

export function useRequestCoachRole() {
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);

  return useMutation({
    mutationFn: async (payload: CreateCoachPayload) => {
      const userId = user?.id;
      if (!userId) throw new Error("وارد حساب نشده‌اید");

      const result = await requestCoachRole(userId, payload);

      // بعد از ایجاد coach — best-effort
      if (payload.specialtyIds?.length) {
        try {
          await attachCoachSpecialties(payload.specialtyIds);
        } catch {
          // PENDING ممکن است PATCH را نپذیرد؛ عناوین در bio هستند
        }
      }

      return result;
    },
    onSuccess: async () => {
      clearRoleFlowIntent();
      toast.success("درخواست مربیگری ثبت شد");
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ثبت درخواست مربیگری ناموفق بود"));
    },
  });
}

export function useRequestStoreRole() {
  const queryClient = useQueryClient();
  const user = useUserStore((s) => s.user);

  return useMutation({
    mutationFn: async (payload: CreateStorePayload) => {
      const userId = user?.id;
      if (!userId) throw new Error("وارد حساب نشده‌اید");
      return requestStoreRole(userId, payload);
    },
    onSuccess: async () => {
      clearRoleFlowIntent();
      toast.success("درخواست فروشندگی ثبت شد");
      await queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ثبت درخواست فروشندگی ناموفق بود"));
    },
  });
}
