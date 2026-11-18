"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/api/client";
import {
  acceptPlanRequest,
  cancelPlanRequest,
  createPlanRequest,
  deleteMyPlanRequest,
  fetchCoachPlanRequests,
  fetchMyPlanRequests,
  rejectPlanRequest,
} from "./api";
import type { CreatePlanRequestInput, RejectPlanRequestInput } from "./types";

export const planRequestKeys = {
  all: ["plan-request"] as const,
  my: () => [...planRequestKeys.all, "my"] as const,
  coachInbox: () => [...planRequestKeys.all, "coach"] as const,
};

export function useMyPlanRequests(enabled = true) {
  return useQuery({
    queryKey: planRequestKeys.my(),
    queryFn: fetchMyPlanRequests,
    enabled,
    staleTime: 15_000,
  });
}

export function useCoachPlanRequests(enabled = true) {
  return useQuery({
    queryKey: planRequestKeys.coachInbox(),
    queryFn: fetchCoachPlanRequests,
    enabled,
    staleTime: 15_000,
  });
}

export function useCreatePlanRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePlanRequestInput) => createPlanRequest(input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: planRequestKeys.all });
      toast.success("درخواست برای مربی ثبت شد");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در ثبت درخواست"));
    },
  });
}

export function useCancelPlanRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelPlanRequest(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: planRequestKeys.all });
      toast.success("درخواست لغو شد");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در لغو درخواست"));
    },
  });
}

export function useDeleteMyPlanRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteMyPlanRequest(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: planRequestKeys.all });
      toast.success("درخواست حذف شد");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در حذف درخواست"));
    },
  });
}

export function useAcceptPlanRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => acceptPlanRequest(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: planRequestKeys.all });
      toast.success("درخواست پذیرفته شد");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در تأیید درخواست"));
    },
  });
}

export function useRejectPlanRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input?: RejectPlanRequestInput;
    }) => rejectPlanRequest(id, input),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: planRequestKeys.all });
      toast.success("درخواست رد شد");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در رد درخواست"));
    },
  });
}
