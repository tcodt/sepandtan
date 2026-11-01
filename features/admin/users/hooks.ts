"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createAdminUser,
  deleteAdminUser,
  fetchAdminUsers,
  updateAdminUser,
} from "./api";
import type { AdminUsersFilters, UpdateAdminUserPayload } from "./types";
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
    onSuccess: () => {
      toast.success("کاربر به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: adminUsersKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی ناموفق بود"));
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
