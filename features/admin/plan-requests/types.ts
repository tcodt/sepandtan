export type PlanRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PAID"
  | "DELIVERED"
  | "REJECTED"
  | "CANCELLED";

export type PlanRequestAdminItem = {
  id: string;
  status: PlanRequestStatus;
  note: string | null;
  rejectionReason: string | null;
  coachId: string | null;
  coachName: string | null;
  userId: string | null;
  userName: string | null;
  userPhone: string | null;
  workoutTemplateId: string | null;
  dietTemplateId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type PlanRequestAdminFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  status?: PlanRequestStatus | "ALL";
  coachId?: string;
};

export type PlanRequestAdminListResponse = {
  data: PlanRequestAdminItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/** PUT /plan-request/admin/{id} — PlanRequestAdminDto */
export type PlanRequestAdminUpdatePayload = {
  status?: PlanRequestStatus;
  dietTemplateId?: string;
  note?: string;
  rejectionReason?: string;
};
