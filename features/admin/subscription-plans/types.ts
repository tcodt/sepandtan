export type PlanAudienceType = "USER" | "COACH" | "STORE";

export type SubscriptionPlanAdmin = {
  id: string;
  slug: string;
  title: string;
  type: PlanAudienceType | null;
  coverImg: string | null;
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
};

export type SubscriptionPlanInput = {
  slug: string;
  title: string;
  type?: PlanAudienceType;
  coverImg?: string | null;
  description?: string | null;
  price: number;
  originalPrice?: number | null;
  durationDays: number;
  trialDays?: number;
  aiPlanLimitPerMonth?: number | null;
  aiChatLimitPerDay?: number | null;
  canRequestCoach?: boolean;
  canTrackProgress?: boolean;
  features: string[];
  isPopular?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

export type SubscriptionPlanFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  search?: string;
};

export type SubscriptionPlansResponse = {
  data: SubscriptionPlanAdmin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  };
};
