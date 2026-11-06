"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAdminOverviewSnapshot } from "./overview-api";

export const adminOverviewKeys = {
  all: ["admin", "overview"] as const,
  snapshot: () => [...adminOverviewKeys.all, "snapshot"] as const,
};

export function useAdminOverview(refetchIntervalMs = 60_000) {
  return useQuery({
    queryKey: adminOverviewKeys.snapshot(),
    queryFn: fetchAdminOverviewSnapshot,
    staleTime: 30_000,
    refetchInterval: refetchIntervalMs,
  });
}
