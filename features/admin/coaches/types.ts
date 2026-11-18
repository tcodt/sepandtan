export type CoachRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "DELETED";

export type AdminCoachItem = {
  id: string;
  coachId: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
  accountStatus: string;
  avatarUrl: string | null;
  createdAt: string;
  coachStatus: CoachRequestStatus | null;
  bio: string | null;
  headline: string | null;
  userId: string | null;
  rejectionReason: string | null;
};

export type AdminCoachesFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  status?: CoachRequestStatus | "ALL";
  search?: string;
};

export type AdminCoachesResponse = {
  data: AdminCoachItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
  };
};

export type UpdateCoachByAdminPayload = {
  status: CoachRequestStatus;
  rejectionReason?: string | null;
};

export type UpdateCoachByAdminResult = {
  roleSynced: boolean;
  userId: string | null;
  roleError?: string;
};
