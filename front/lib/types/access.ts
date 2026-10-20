/** Access-based Plans + Financial Models */

export type PlanAccessStatus = "active" | "expired" | "pending_activation";

export type PaymentType = "plan_access" | "subscription" | "renewal";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export type WithdrawalStatus = "available" | "pending" | "paid" | "blocked";

export type PlanAccess = {
  id: string;
  userId: string;
  planId: string;
  durationDays: 30 | 45 | 90;
  startDate: string | null;
  endDate: string | null;
  status: PlanAccessStatus;
  isRenewal: boolean;
  purchaseId: string;
  pricePaid: number;
  createdAt: string;
  activatedAt?: string | null;
  planTitle?: string;
  planSource?: "ai" | "coach";
  coachId?: string | null;
  coachName?: string | null;
};

export type Payment = {
  id: string;
  userId: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  description: string;
  planAccessId?: string | null;
  planId?: string | null;
  durationDays?: 30 | 45 | 90 | null;
  createdAt: string;
  paidAt?: string | null;
  metadata?: {
    isRenewal?: boolean;
    discountPercent?: number;
    originalAmount?: number;
  };
};

export type CoachSale = {
  id: string;
  coachId: string;
  userId: string;
  userName: string;
  planId: string;
  planTitle: string;
  planAccessId: string;
  amount: number;
  commissionRate: number;
  commissionAmount: number;
  status: "completed" | "refunded";
  createdAt: string;
  paidAt?: string | null;
};

export type CoachEarningsSummary = {
  coachId: string;
  currentMonthRevenue: number;
  currentMonthSalesCount: number;
  totalCommission: number;
  availableForWithdrawal: number;
  withdrawalStatus: WithdrawalStatus;
  lastUpdated: string;
};

/** سطح اشتراک قفل‌شده (جدا از Training Plan) */
export type SubscriptionTier =
  | "free"
  | "basic"
  | "pro"
  | "premium"
  | "coach_plan";

export const ACCESS_DURATION_OPTIONS = [
  { days: 30 as const, label: "۳۰ روز", badge: null },
  { days: 45 as const, label: "۴۵ روز", badge: "محبوب‌ترین" },
  { days: 90 as const, label: "۹۰ روز", badge: null },
] as const;

export const SUBSCRIPTION_PRICES = {
  basic: { amount: 349_000, days: 30, label: "بیسیک" },
  pro: { amount: 499_000, days: 45, label: "پرو" },
  premium: { amount: 699_000, days: 30, label: "پریمیوم" },
} as const;
