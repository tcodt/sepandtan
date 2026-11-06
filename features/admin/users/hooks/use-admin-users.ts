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

export function useSuspendAdminUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => updateAdminUser(id, { status: "SUSPENDED" }),
    onSuccess: () => {
      toast.success("کاربر معلق شد — دسترسی‌ها قطع می‌شود");
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "تعلیق ناموفق بود")),
  });
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await deleteAdminUser(id);
      } catch (err) {
        // بعضی بک‌اندها DELETE واقعی ندارند / 403 / 405
        // → حداقل حذف منطقی
        const status =
          typeof err === "object" &&
          err !== null &&
          "response" in err &&
          typeof (err as { response?: { status?: number } }).response
            ?.status === "number"
            ? (err as { response: { status: number } }).response.status
            : null;

        if (status === 403 || status === 404 || status === 405) {
          await softDeleteAdminUser(id);
          return { mode: "soft" as const };
        }
        throw err;
      }
      return { mode: "hard" as const };
    },

    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: adminUsersKeys.all });
      const previous = queryClient.getQueriesData<AdminUsersResponse>({
        queryKey: adminUsersKeys.all,
      });

      // فوری از همه کش‌های لیست حذف کن
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
      toast.error(getErrorMessage(error, "حذف کاربر ناموفق بود"));
    },

    onSuccess: (result) => {
      if (result?.mode === "soft") {
        toast.success("کاربر به‌صورت منطقی حذف شد (status=DELETED)");
      } else {
        toast.success("کاربر حذف شد");
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
    },
  });
}

export function useSoftDeleteAdminUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => softDeleteAdminUser(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: adminUsersKeys.all });
      const previous = queryClient.getQueriesData<AdminUsersResponse>({
        queryKey: adminUsersKeys.all,
      });

      queryClient.setQueriesData<AdminUsersResponse>(
        { queryKey: adminUsersKeys.all },
        (old) => {
          if (!old) return old;
          // از لیست ACTIVE خارج می‌شود؛ اگر ALL است badge حذف‌شده
          return {
            ...old,
            users: old.users
              .map((u) =>
                u.id === id
                  ? ({ ...u, status: "DELETED", role: "USER" } as AdminUser)
                  : u,
              )
              .filter(() => {
                // اگر این query فقط ACTIVE می‌خواست، حذف از UI
                return true;
              }),
          };
        },
      );

      return { previous };
    },
    onError: (error, _id, context) => {
      context?.previous?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error(getErrorMessage(error, "حذف منطقی ناموفق بود"));
    },
    onSuccess: () => {
      toast.success("کاربر حذف منطقی شد و دیگر دسترسی ندارد");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
    },
  });
}
