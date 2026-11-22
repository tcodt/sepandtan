"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  createCity,
  createProvince,
  deleteCity,
  deleteProvince,
  fetchAdminCities,
  fetchAdminProvinces,
  updateCity,
  updateProvince,
} from "../api";
import type { CityInput, CityUpdateInput, ProvinceInput } from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const provinceAdminKeys = {
  all: ["admin", "province"] as const,
  provinces: () => [...provinceAdminKeys.all, "list"] as const,
  cities: (provinceId?: string) =>
    [...provinceAdminKeys.all, "cities", provinceId ?? "all"] as const,
};

export function useAdminProvinces() {
  return useQuery({
    queryKey: provinceAdminKeys.provinces(),
    queryFn: fetchAdminProvinces,
    staleTime: 60_000,
  });
}

export function useAdminCities(provinceId?: string) {
  return useQuery({
    queryKey: provinceAdminKeys.cities(provinceId),
    queryFn: () => fetchAdminCities(provinceId),
    enabled: Boolean(provinceId),
    staleTime: 60_000,
  });
}

export function useCreateProvince() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProvinceInput) => createProvince(input),
    onSuccess: async () => {
      toast.success("استان ایجاد شد");
      await qc.invalidateQueries({ queryKey: provinceAdminKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ایجاد استان ناموفق بود")),
  });
}

export function useUpdateProvince() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProvinceInput }) =>
      updateProvince(id, input),
    onSuccess: async () => {
      toast.success("استان به‌روزرسانی شد");
      await qc.invalidateQueries({ queryKey: provinceAdminKeys.all });
    },
    onError: (e) =>
      toast.error(getErrorMessage(e, "به‌روزرسانی استان ناموفق بود")),
  });
}

export function useDeleteProvince() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProvince(id),
    onSuccess: async () => {
      toast.success("استان حذف شد");
      await qc.invalidateQueries({ queryKey: provinceAdminKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف استان ناموفق بود")),
  });
}

export function useCreateCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CityInput) => createCity(input),
    onSuccess: async () => {
      toast.success("شهر ایجاد شد");
      await qc.invalidateQueries({ queryKey: provinceAdminKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ایجاد شهر ناموفق بود")),
  });
}

export function useUpdateCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CityUpdateInput }) =>
      updateCity(id, input),
    onSuccess: async () => {
      toast.success("شهر به‌روزرسانی شد");
      await qc.invalidateQueries({ queryKey: provinceAdminKeys.all });
    },
    onError: (e) =>
      toast.error(getErrorMessage(e, "به‌روزرسانی شهر ناموفق بود")),
  });
}

export function useDeleteCity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCity(id),
    onSuccess: async () => {
      toast.success("شهر حذف شد");
      await qc.invalidateQueries({ queryKey: provinceAdminKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "حذف شهر ناموفق بود")),
  });
}
