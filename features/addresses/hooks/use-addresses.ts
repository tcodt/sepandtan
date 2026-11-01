"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  fetchDefaultAddress,
  setDefaultAddress,
  updateAddress,
} from "../api";
import type { CreateAddressInput, UpdateAddressInput } from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const addressKeys = {
  all: ["addresses"] as const,
  list: () => [...addressKeys.all, "list"] as const,
  default: () => [...addressKeys.all, "default"] as const,
  detail: (id: string) => [...addressKeys.all, "detail", id] as const,
};

export function useAddresses() {
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: fetchAddresses,
  });
}

export function useDefaultAddress() {
  return useQuery({
    queryKey: addressKeys.default(),
    queryFn: fetchDefaultAddress,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAddressInput) => createAddress(payload),
    onSuccess: () => {
      toast.success("آدرس با موفقیت ثبت شد");
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ثبت آدرس ناموفق بود"));
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateAddressInput;
    }) => updateAddress(id, payload),
    onSuccess: () => {
      toast.success("آدرس به‌روزرسانی شد");
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی آدرس ناموفق بود"));
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: () => {
      toast.success("آدرس حذف شد");
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "حذف آدرس ناموفق بود"));
    },
  });
}

export function useSetDefaultAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: () => {
      toast.success("آدرس پیش‌فرض تنظیم شد");
      queryClient.invalidateQueries({ queryKey: addressKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "تنظیم آدرس پیش‌فرض ناموفق بود"));
    },
  });
}
