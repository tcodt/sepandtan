export type AdminSubscriptionStatus =
  | "PENDING"
  | "ACTIVE"
  | "TRIALING"
  | "EXPIRED"
  | "CANCELLED";

export type AdminSubscriptionItem = {
  id: string;
  status: AdminSubscriptionStatus;
  planId: string | null;
  planTitle: string | null;
  userId: string | null;
  userName: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string | null;
};

export type AdminSubscriptionFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  status?: AdminSubscriptionStatus | "ALL";
};

export type AdminSubscriptionListResponse = {
  data: AdminSubscriptionItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
