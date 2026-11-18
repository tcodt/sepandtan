"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  approveWithdraw,
  completeTransaction,
  failTransaction,
  fetchAdminTransactions,
  fetchAdminWallets,
  rejectWithdraw,
} from "../api";
import type { AdminTransactionsFilters, AdminWalletsFilters } from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const adminWalletKeys = {
  all: ["admin", "wallet"] as const,
  wallets: (f: AdminWalletsFilters) =>
    [...adminWalletKeys.all, "wallets", f] as const,
  txs: (f: AdminTransactionsFilters) =>
    [...adminWalletKeys.all, "transactions", f] as const,
};

export function useAdminWallets(filters: AdminWalletsFilters = {}) {
  return useQuery({
    queryKey: adminWalletKeys.wallets(filters),
    queryFn: () => fetchAdminWallets(filters),
    placeholderData: (p) => p,
    staleTime: 15_000,
  });
}

export function useAdminTransactions(filters: AdminTransactionsFilters = {}) {
  return useQuery({
    queryKey: adminWalletKeys.txs(filters),
    queryFn: () => fetchAdminTransactions(filters),
    placeholderData: (p) => p,
    staleTime: 15_000,
  });
}

function useWalletAction(
  fn: (id: string) => Promise<void>,
  successMsg: string,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: async () => {
      toast.success(successMsg);
      await queryClient.invalidateQueries({ queryKey: adminWalletKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "عملیات ناموفق بود"));
    },
  });
}

export function useCompleteTransaction() {
  return useWalletAction(completeTransaction, "تراکنش تکمیل شد");
}
export function useFailTransaction() {
  return useWalletAction(failTransaction, "تراکنش ناموفق علامت‌گذاری شد");
}
export function useApproveWithdraw() {
  return useWalletAction(approveWithdraw, "برداشت تأیید شد");
}
export function useRejectWithdraw() {
  return useWalletAction(rejectWithdraw, "برداشت رد شد");
}
