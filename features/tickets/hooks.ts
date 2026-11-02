"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/api/client";
import {
  addTicketMessage,
  createTicket,
  deleteTicket,
  fetchAdminTickets,
  fetchMyTickets,
  fetchTicketById,
  fetchTicketStats,
  markTicketRead,
  updateTicket,
} from "./api";
import type {
  CreateTicketInput,
  CreateTicketMessageInput,
  TicketsFilters,
  UpdateTicketInput,
} from "./types";

export const ticketKeys = {
  all: ["tickets"] as const,
  mine: (filters: TicketsFilters) =>
    [...ticketKeys.all, "me", filters] as const,
  admin: (filters: TicketsFilters) =>
    [...ticketKeys.all, "admin", filters] as const,
  detail: (id: string) => [...ticketKeys.all, "detail", id] as const,
  stats: () => [...ticketKeys.all, "stats"] as const,
};

export function useMyTickets(filters: TicketsFilters = {}) {
  return useQuery({
    queryKey: ticketKeys.mine(filters),
    queryFn: () => fetchMyTickets(filters),
    placeholderData: (p) => p,
  });
}

export function useAdminTickets(filters: TicketsFilters = {}) {
  return useQuery({
    queryKey: ticketKeys.admin(filters),
    queryFn: () => fetchAdminTickets(filters),
    placeholderData: (p) => p,
  });
}

export function useTicketDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: () => fetchTicketById(id),
    enabled: enabled && Boolean(id),
  });
}

export function useTicketStats(enabled = true) {
  return useQuery({
    queryKey: ticketKeys.stats(),
    queryFn: fetchTicketStats,
    enabled,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketInput) => createTicket(payload),
    onSuccess: async () => {
      toast.success("تیکت ثبت شد");
      await qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ثبت تیکت ناموفق بود")),
  });
}

export function useAddTicketMessage(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTicketMessageInput) =>
      addTicketMessage(ticketId, payload),
    onSuccess: async () => {
      toast.success("پیام ارسال شد");
      await qc.invalidateQueries({ queryKey: ticketKeys.detail(ticketId) });
      await qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e, "ارسال پیام ناموفق بود")),
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTicketInput }) =>
      updateTicket(id, payload),
    onSuccess: async (_d, vars) => {
      toast.success("تیکت به‌روز شد");
      await qc.invalidateQueries({ queryKey: ticketKeys.detail(vars.id) });
      await qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useMarkTicketRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markTicketRead(id),
    onSuccess: async (_d, id) => {
      await qc.invalidateQueries({ queryKey: ticketKeys.detail(id) });
      await qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
  });
}

export function useDeleteTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTicket(id),
    onSuccess: async () => {
      toast.success("تیکت حذف شد");
      await qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
