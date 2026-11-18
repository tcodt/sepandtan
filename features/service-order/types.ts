export type PaymentMethod = "WALLET" | "ZARINPAL" | "CARD";

export type QuoteResult = {
  amount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  subscriptionId?: string | null;
  planRequestId?: string | null;
  raw: Record<string, unknown>;
};

export type PayResult = {
  paymentId: string | null;
  status: string | null;
  /** gateway redirect URL when method is ZARINPAL */
  paymentUrl: string | null;
  authority: string | null;
  raw: Record<string, unknown>;
};

export type QuoteSubscriptionInput = {
  subscriptionId: string;
  discountCode?: string;
};

export type PaySubscriptionInput = {
  subscriptionId: string;
  method: PaymentMethod;
  discountCode?: string;
};

export type QuotePlanInput = {
  planRequestId: string;
  discountCode?: string;
};

export type PayPlanInput = {
  planRequestId: string;
  method: PaymentMethod;
  discountCode?: string;
};
