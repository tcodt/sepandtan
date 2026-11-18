"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  deleteTicket,
  fetchAdminTickets,
  fetchTicketById,
  fetchTicketStats,
  replyToTicket,
  updateTicket,
} from "../api";
import type { AdminTicketsFilters, UpdateTicketInput } from "../types";
import { getErrorMessage } from "@/lib/api/client";

export const adminTicketsKeys: {
  all: readonly ["admin", "tickets"];
  list: (
    filters: AdminTicketsFilters,
  ) => readonly ["admin", "tickets", "list", AdminTicketsFilters];
  detail: (id: string) => readonly ["admin", "tickets", "detail", string];
  stats: readonly ["admin", "tickets", "stats"];
} = {
  all: ["admin", "tickets"] as const,
  list: (filters: AdminTicketsFilters) =>
    [...adminTicketsKeys.all, "list", filters] as const,
  detail: (id: string) => [...adminTicketsKeys.all, "detail", id] as const,
  stats: ["admin", "tickets", "stats"] as const,
};

export function useAdminTickets(filters: AdminTicketsFilters = {}) {
  return useQuery({
    queryKey: adminTicketsKeys.list(filters),
    queryFn: () => fetchAdminTickets(filters),
    placeholderData: (previous) => previous,
    staleTime: 15_000,
  });
}

export function useTicketStats() {
  return useQuery({
    queryKey: adminTicketsKeys.stats,
    queryFn: fetchTicketStats,
    staleTime: 30_000,
  });
}

export function useTicketDetail(id: string) {
  return useQuery({
    queryKey: adminTicketsKeys.detail(id),
    queryFn: () => fetchTicketById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTicketInput }) =>
      updateTicket(id, input),
    onSuccess: async (_d, vars) => {
      toast.success("تیکت به‌روزرسانی شد");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminTicketsKeys.all }),
        queryClient.invalidateQueries({
          queryKey: adminTicketsKeys.detail(vars.id),
        }),
      ]);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "به‌روزرسانی تیکت ناموفق بود"));
    },
  });
}

export function useReplyTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      replyToTicket(id, content),
    onSuccess: async (_d, vars) => {
      toast.success("پیام ارسال شد");
      await queryClient.invalidateQueries({
        queryKey: adminTicketsKeys.detail(vars.id),
      });
      await queryClient.invalidateQueries({ queryKey: adminTicketsKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ارسال پیام ناموفق بود"));
    },
  });
}

export function useDeleteTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTicket(id),
    onSuccess: async () => {
      toast.success("تیکت حذف شد");
      await queryClient.invalidateQueries({ queryKey: adminTicketsKeys.all });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "حذف ناموفق بود"));
    },
  });
}
