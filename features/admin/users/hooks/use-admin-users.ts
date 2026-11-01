"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from "../api";
import type {
  AdminUser,
  AdminUsersFilters,
  AdminUsersResponse,
  UpdateAdminUserPayload,
} from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const adminUsersKeys = {
  all: ["admin", "users"] as const,
  list: (filters: AdminUsersFilters) =>
    [...adminUsersKeys.all, "list", filters] as const,
};

export function useAdminUsers(filters: AdminUsersFilters) {
  return useQuery({
    queryKey: adminUsersKeys.list(filters),
    queryFn: () => fetchAdminUsers(filters),
    placeholderData: (previous) => previous,
  });
}

export function useCreateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateAdminUserPayload) => createAdminUser(payload),
    onSuccess: () => {
      toast.success("کاربر با موفقیت ساخته شد");
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ساخت کاربر ناموفق بود"));
    },
  });
}

export function useUpdateAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAdminUserPayload;
    }) => updateAdminUser(id, payload),

    // UI فوری عوض شود
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: adminUsersKeys.all });

      const previous = queryClient.getQueriesData<AdminUsersResponse>({
        queryKey: adminUsersKeys.all,
      });

      queryClient.setQueriesData<AdminUsersResponse>(
        { queryKey: adminUsersKeys.all },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            users: old.users.map((u) =>
              u.id === id ? ({ ...u, ...payload } as AdminUser) : u,
            ),
          };
        },
      );

      return { previous };
    },

    onError: (error, _vars, context) => {
      // rollback
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(getErrorMessage(error, "به‌روزرسانی ناموفق بود"));
    },

    onSuccess: () => {
      toast.success("کاربر به‌روزرسانی شد");
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
    },
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => {
      toast.success("کاربر حذف شد");
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "حذف کاربر ناموفق بود"));
    },
  });
}
