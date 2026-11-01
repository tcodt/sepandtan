"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchCities, fetchProvinces } from "../api";

export const locationKeys = {
  all: ["location"] as const,
  provinces: () => [...locationKeys.all, "provinces"] as const,
  cities: (provinceId?: string) =>
    [...locationKeys.all, "cities", provinceId ?? "all"] as const,
};

export function useProvinces() {
  return useQuery({
    queryKey: locationKeys.provinces(),
    queryFn: fetchProvinces,
    staleTime: 1000 * 60 * 30, // ۳۰ دقیقه — داده تقریباً ثابت
  });
}

export function useCities(provinceId?: string) {
  return useQuery({
    queryKey: locationKeys.cities(provinceId),
    queryFn: () => fetchCities(provinceId),
    enabled: Boolean(provinceId),
    staleTime: 1000 * 60 * 30,
  });
}
