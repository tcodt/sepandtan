"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchAdminStores, updateStoreByAdmin } from "../api";
import type {
  AdminStoresFilters,
  StoreRequestStatus,
  UpdateStoreByAdminPayload,
} from "../types";
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

    onSuccess: async (_data, vars) => {
      const status = vars.payload.status;
      if (status === "APPROVED") {
        toast.success(
          vars.source === "store"
            ? "فروشگاه تأیید شد"
            : "درخواست فروشنده تأیید شد — کاربر پس از ورود بعدی به پنل فروشنده می‌رود",
        );
      } else if (status === "REJECTED") {
        toast.success(
          vars.source === "store" ? "فروشگاه رد شد" : "درخواست فروشنده رد شد",
        );
      } else {
        toast.success("وضعیت به‌روزرسانی شد");
      }

      // همه فیلترها را تازه کن تا اگر روی PENDING بودید آیتم جابه‌جا شده دیده شود
      await queryClient.invalidateQueries({ queryKey: adminStoresKeys.all });
    },

    onError: (error) => {
      toast.error(
        getErrorMessage(error, "به‌روزرسانی وضعیت فروشنده ناموفق بود"),
      );
    },
  });
}

/** helper اختیاری برای صفحه */
export function statusToastLabel(status: StoreRequestStatus) {
  if (status === "APPROVED") return "تأیید";
  if (status === "REJECTED") return "رد";
  return "در انتظار";
}
