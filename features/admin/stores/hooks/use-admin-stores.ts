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

    onSuccess: async (_data, vars) => {
      const status = vars.payload.status;

      if (status === "APPROVED") {
        toast.success("فروشنده تأیید شد و نقش کاربر به STORE تغییر کرد");
        if (vars.ownerId) {
          rememberAdminRoleLock(vars.ownerId, "seller");
        }
      } else if (status === "REJECTED") {
        toast.success("درخواست فروشنده رد شد");
      } else {
        toast.success("وضعیت به‌روزرسانی شد");
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminStoresKeys.all }),
        // لیست کاربران باید نقش جدید را ببیند
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
