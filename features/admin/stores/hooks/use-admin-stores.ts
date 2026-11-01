"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchAdminStores, updateStoreByAdmin } from "../api";
import type { AdminStoresFilters, UpdateStoreByAdminPayload } from "../types";
import { getErrorMessage } from "@/lib/api/client";

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
    }: {
      storeId: string;
      payload: UpdateStoreByAdminPayload;
      source?: "store" | "request";
    }) => updateStoreByAdmin(storeId, payload, source ?? "request"),
    onSuccess: () => {
      toast.success("وضعیت فروشنده به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: adminStoresKeys.all });
    },
    onError: (error) => {
      toast.error(
        getErrorMessage(error, "به‌روزرسانی وضعیت فروشنده ناموفق بود"),
      );
    },
  });
}
