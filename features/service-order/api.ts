import { apiClient } from "@/lib/api/client";
import { asNumber, asString } from "@/features/catalog/utils";
import type {
  PayPlanInput,
  PayResult,
  PaySubscriptionInput,
  QuotePlanInput,
  QuoteResult,
  QuoteSubscriptionInput,
} from "./types";

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return asString(value);
}

function mapQuote(raw: unknown): QuoteResult {
  const r = (raw ?? {}) as Record<string, unknown>;
  const nested =
    (r.data as Record<string, unknown> | undefined) ??
    (r.quote as Record<string, unknown> | undefined) ??
    r;

  const amount =
    asNumber(nested.amount) ??
    asNumber(nested.total) ??
    asNumber(nested.price) ??
    asNumber(nested.originalAmount) ??
    0;

  const discountAmount =
    asNumber(nested.discountAmount) ??
    asNumber(nested.discount) ??
    asNumber(nested.discountValue) ??
    0;

  const finalAmount =
    asNumber(nested.finalAmount) ??
    asNumber(nested.payable) ??
    asNumber(nested.payableAmount) ??
    amount - discountAmount;

  return {
    amount,
    discountAmount,
    finalAmount: finalAmount < 0 ? 0 : finalAmount,
    currency: asString(nested.currency) ?? "IRR",
    subscriptionId: asNullableString(nested.subscriptionId),
    planRequestId: asNullableString(nested.planRequestId),
    raw: nested,
  };
}

function mapPay(raw: unknown): PayResult {
  const r = (raw ?? {}) as Record<string, unknown>;
  const nested =
    (r.data as Record<string, unknown> | undefined) ??
    (r.payment as Record<string, unknown> | undefined) ??
    r;

  return {
    paymentId:
      asNullableString(nested.paymentId) ??
      asNullableString(nested.id) ??
      asNullableString(nested.payment_id),
    status: asNullableString(nested.status),
    paymentUrl:
      asNullableString(nested.paymentUrl) ??
      asNullableString(nested.url) ??
      asNullableString(nested.gatewayUrl) ??
      asNullableString(nested.redirectUrl) ??
      asNullableString(nested.link),
    authority:
      asNullableString(nested.authority) ??
      asNullableString(nested.refId) ??
      asNullableString(nested.trackId),
    raw: nested,
  };
}

/** POST /service-order/subscription/quote */
export async function quoteSubscription(
  input: QuoteSubscriptionInput,
): Promise<QuoteResult> {
  const { data } = await apiClient.post("/service-order/subscription/quote", {
    subscriptionId: input.subscriptionId,
    ...(input.discountCode ? { discountCode: input.discountCode } : {}),
  });
  return mapQuote(data);
}

/** POST /service-order/subscription/pay */
export async function paySubscription(
  input: PaySubscriptionInput,
): Promise<PayResult> {
  const { data } = await apiClient.post("/service-order/subscription/pay", {
    subscriptionId: input.subscriptionId,
    method: input.method,
    ...(input.discountCode ? { discountCode: input.discountCode } : {}),
  });
  return mapPay(data);
}

/** POST /service-order/plan/quote — پرداخت برنامه مربی */
export async function quotePlan(input: QuotePlanInput): Promise<QuoteResult> {
  const { data } = await apiClient.post("/service-order/plan/quote", {
    planRequestId: input.planRequestId,
    ...(input.discountCode ? { discountCode: input.discountCode } : {}),
  });
  return mapQuote(data);
}

/** POST /service-order/plan/pay */
export async function payPlan(input: PayPlanInput): Promise<PayResult> {
  const { data } = await apiClient.post("/service-order/plan/pay", {
    planRequestId: input.planRequestId,
    method: input.method,
    ...(input.discountCode ? { discountCode: input.discountCode } : {}),
  });
  return mapPay(data);
}
