export type UserPlanStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type UserPlanType = "WORKOUT" | "DIET" | "ALL";

export type AdminUserPlanItem = {
  id: string;
  title: string;
  status: UserPlanStatus;
  type: UserPlanType;
  startDate: string | null;
  endDate: string | null;
  userId: string | null;
  userName: string | null;
  coachId: string | null;
  coachName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type AdminUserPlanFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  status?: UserPlanStatus | "ALL";
};

export type AdminUserPlanListResponse = {
  data: AdminUserPlanItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
