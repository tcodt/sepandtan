"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  softDeleteAdminUser,
  updateAdminUser,
} from "../api";
import type {
  AdminUser,
  AdminUsersFilters,
  AdminUsersResponse,
  CreateAdminUserPayload,
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
    mutationFn: (payload: CreateAdminUserPayload) => createAdminUser(payload),
    onSuccess: () => {
      toast.success("کاربر با موفقیت ساخته شد");
      void queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
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
              u.id === id
                ? ({
                    ...u,
                    ...payload,
                    // password را در UI نگه نمی‌داریم
                    ...(payload.password ? {} : {}),
                  } as AdminUser)
                : u,
            ),
          };
        },
      );

      return { previous };
    },

    onError: (error, _vars, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(getErrorMessage(error, "به‌روزرسانی ناموفق بود"));
    },

    onSuccess: () => {
      toast.success("کاربر به‌روزرسانی شد");
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
    },
  });
}

export function useSoftDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => softDeleteAdminUser(id),
    onSuccess: () => {
      toast.success("کاربر حذف منطقی شد (status=DELETED)");
      void queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "حذف منطقی ناموفق بود"));
    },
  });
}

/**
 * حذف دائم از سرور — بدون soft-fallback
 * اگر 403 بگیرید یعنی نقش شما Super Admin نیست.
 */
export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),

    onMutate: async (id) => {
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
            users: old.users.filter((u) => u.id !== id),
            pagination: {
              ...old.pagination,
              total: Math.max(0, (old.pagination.total ?? 1) - 1),
            },
          };
        },
      );

      return { previous };
    },

    onError: (error, _id, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(
        getErrorMessage(
          error,
          "حذف دائم ناموفق بود. معمولاً فقط Super Admin مجاز است.",
        ),
      );
    },

    onSuccess: () => {
      toast.success("کاربر برای همیشه از سرور حذف شد");
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
    },
  });
}
