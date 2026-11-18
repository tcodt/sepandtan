/** Aligned with swagger: SubscriptionPlanEntity / SubscriptionEntity */

export type BackendSubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "TRIALING";

export type SubscriptionPlanDto = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  durationDays: number;
  trialDays: number;
  aiPlanLimitPerMonth: number | null;
  aiChatLimitPerDay: number | null;
  canRequestCoach: boolean;
  canTrackProgress: boolean;
  features: string[];
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type SubscriptionDto = {
  id: string;
  userId: string;
  planId: string;
  status: BackendSubscriptionStatus;
  pricePaid: number;
  startsAt: string | null;
  endsAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  plan: SubscriptionPlanDto | null;
};

export type SubscribePlanInput = {
  planId: string;
};

export type PaginationMeta = {
  nextPage: number | null;
  prevPage: number | null;
  total: number;
};

export type SubscriptionPlanListResponse = {
  plans: SubscriptionPlanDto[];
  pagination: PaginationMeta;
};
