"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createEquipment,
  deleteEquipment,
  fetchAdminEquipment,
  updateEquipment,
} from "../api";
import type { EquipmentFilters, EquipmentInput } from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const equipmentKeys = {
  all: ["admin", "equipment"] as const,
  list: (filters: EquipmentFilters) =>
    [...equipmentKeys.all, "list", filters] as const,
};

export function useAdminEquipment(filters: EquipmentFilters = {}) {
  return useQuery({
    queryKey: equipmentKeys.list(filters),
    queryFn: () => fetchAdminEquipment(filters),
    placeholderData: (previous) => previous,
    staleTime: 30_000,
  });
}

export function useCreateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EquipmentInput) => createEquipment(input),
    onSuccess: async () => {
      toast.success("تجهیزات ایجاد شد");
      await queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ایجاد ناموفق بود"));
    },
  });
}

export function useUpdateEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: EquipmentInput }) =>
      updateEquipment(id, input),
    onSuccess: async () => {
      toast.success("تجهیزات به‌روزرسانی شد");
      await queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی ناموفق بود"));
    },
  });
}

export function useDeleteEquipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteEquipment(id),
    onSuccess: async () => {
      toast.success("تجهیزات حذف شد");
      await queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "حذف ناموفق بود"));
    },
  });
}
