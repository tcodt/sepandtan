"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { getErrorMessage } from "@/lib/api/client";
import { payPlan, paySubscription, quotePlan, quoteSubscription } from "./api";
import type {
  PayPlanInput,
  PaySubscriptionInput,
  QuotePlanInput,
  QuoteSubscriptionInput,
} from "./types";

export function useQuoteSubscription() {
  return useMutation({
    mutationFn: (input: QuoteSubscriptionInput) => quoteSubscription(input),
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در محاسبه مبلغ"));
    },
  });
}

export function usePaySubscription() {
  return useMutation({
    mutationFn: (input: PaySubscriptionInput) => paySubscription(input),
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در پرداخت اشتراک"));
    },
  });
}

export function useQuotePlan() {
  return useMutation({
    mutationFn: (input: QuotePlanInput) => quotePlan(input),
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در محاسبه مبلغ برنامه"));
    },
  });
}

export function usePayPlan() {
  return useMutation({
    mutationFn: (input: PayPlanInput) => payPlan(input),
    onError: (error) => {
      toast.error(getErrorMessage(error, "خطا در پرداخت برنامه"));
    },
  });
}
