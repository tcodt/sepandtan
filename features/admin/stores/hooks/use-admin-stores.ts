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
    staleTime: 15_000,
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
      const roleError = data?.roleError;

      if (status === "APPROVED") {
        if (ownerId) rememberAdminRoleLock(ownerId, "seller");
        if (roleSynced) {
          toast.success("فروشنده تأیید شد — نقش STORE ثبت شد");
        } else {
          toast.success("وضعیت فروشنده APPROVED شد");
          if (roleError) toast.warning(roleError);
        }
      } else if (status === "REJECTED") {
        if (ownerId) rememberAdminRoleLock(ownerId, "seller");
        if (roleSynced) {
          toast.success(
            "رد شد — نقش USER شد؛ پنل فروشنده پس از رفرش پروفایل بسته می‌شود",
          );
        } else {
          toast.success("درخواست فروشنده رد شد");
          if (roleError) toast.warning(roleError);
          else if (!ownerId) {
            toast.warning("ownerId نبود؛ نقش را از Users روی USER بگذارید");
          }
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
