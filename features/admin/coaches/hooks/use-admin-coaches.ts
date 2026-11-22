"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchAdminCoaches, updateCoachByAdmin } from "../api";
import type { AdminCoachesFilters, UpdateCoachByAdminPayload } from "../types";
import { getErrorMessage } from "@/lib/api/client";
import { adminUsersKeys } from "@/features/admin/users/hooks/use-admin-users";
import { rememberAdminRoleLock } from "@/lib/role-lock";

export const adminCoachesKeys = {
  all: ["admin", "coaches"] as const,
  list: (filters: AdminCoachesFilters) =>
    [...adminCoachesKeys.all, "list", filters] as const,
};

export function useAdminCoaches(filters: AdminCoachesFilters) {
  return useQuery({
    queryKey: adminCoachesKeys.list(filters),
    queryFn: () => fetchAdminCoaches(filters),
    placeholderData: (previous) => previous,
    staleTime: 15_000,
  });
}

export function useUpdateCoachByAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      coachId,
      payload,
      userId,
    }: {
      coachId: string;
      payload: UpdateCoachByAdminPayload;
      userId?: string | null;
    }) => updateCoachByAdmin(coachId, payload, { userId }),

    onSuccess: async (data, vars) => {
      const status = vars.payload.status;
      const userId = vars.userId?.trim() || data.userId;
      const roleSynced = data.roleSynced === true;
      const roleError = data.roleError;

      if (status === "APPROVED") {
        if (userId) rememberAdminRoleLock(userId, "coach");
        if (roleSynced) {
          toast.success("مربی تأیید شد — نقش COACH ثبت شد");
        } else {
          toast.success("وضعیت مربی APPROVED شد");
          if (roleError) toast.warning(roleError);
        }
      } else if (status === "REJECTED") {
        if (userId) rememberAdminRoleLock(userId, "coach");
        if (roleSynced) {
          toast.success("رد شد — نقش USER شد");
        } else {
          toast.success("درخواست مربی رد شد");
          if (roleError) toast.warning(roleError);
        }
      } else {
        toast.success("وضعیت مربی به‌روزرسانی شد");
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminCoachesKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminUsersKeys.all }),
      ]);
    },

    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی وضعیت مربی ناموفق بود"));
    },
  });
}
