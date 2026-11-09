"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchAdminStores, updateStoreByAdmin } from "../api";
import type { AdminStoresFilters, UpdateStoreByAdminPayload } from "../types";
import { getErrorMessage } from "@/lib/api/client";
import { adminUsersKeys } from "@/features/admin/users/hooks/use-admin-users";
import { rememberAdminRoleLock } from "@/lib/role-lock";

export const adminStoresKeys = {
  all: ["admin", "stores"] as const,
  list: (filters: AdminStoresFilters) =>
    [...adminStoresKeys.all, "list", filters] as const,
};

export function useAdminStores(filters: AdminStoresFilters) {
  return useQuery({
    queryKey: adminStoresKeys.list(filters),
    queryFn: () => fetchAdminStores(filters),
    placeholderData: (previous) => previous,
  });
}

export function useUpdateStoreByAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      storeId,
      payload,
      source,
      ownerId,
    }: {
      storeId: string;
      payload: UpdateStoreByAdminPayload;
      source?: "store" | "request";
      ownerId?: string | null;
    }) =>
      updateStoreByAdmin(storeId, payload, {
        source: source ?? "request",
        ownerId,
      }),

    onSuccess: async (data, vars) => {
      const status = vars.payload.status;
      const ownerId = vars.ownerId?.trim() || null;
      const roleSynced = data?.roleSynced === true;

      if (status === "APPROVED") {
        if (ownerId) rememberAdminRoleLock(ownerId, "seller");
        toast.success("فروشنده تأیید شد — نقش STORE و قفل seller ثبت شد");
      } else if (status === "REJECTED") {
        // قفل seller می‌ماند (نمی‌تواند coach شود)
        if (ownerId) rememberAdminRoleLock(ownerId, "seller");

        if (roleSynced) {
          toast.success(
            "رد شد — نقش USER شد؛ پنل فروشنده پس از همگام‌سازی پروفایل بسته می‌شود",
          );
        } else if (ownerId) {
          toast.success("رد شد — قفل seller ثبت شد");
        } else {
          toast.success(
            "رد شد. ownerId نبود؛ نقش را از Users روی USER بگذارید",
          );
        }
      } else {
        toast.success("وضعیت به‌روزرسانی شد");
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminStoresKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminUsersKeys.all }),
      ]);
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(error, "به‌روزرسانی وضعیت فروشنده ناموفق بود"),
      );
    },
  });
}
