export type CoachRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED"
  | "DELETED";

export type AdminCoachItem = {
  /** Path id for PATCH /user/coach/{coachId} */
  id: string;
  coachId: string;
  /** User id — for role sync USER ↔ COACH */
  userId: string | null;

  // Identity / contact (from user or coach)
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  accountStatus: string;
  avatarUrl: string | null;
  createdAt: string;

  // Coach profile (CreateCoachDto fields)
  slug: string | null;
  headline: string | null;
  bio: string | null;
  instagram: string | null;
  /** ISO date string from API */
  experienceYears: string | null;
  maxClients: number | null;
  isAcceptingClients: boolean | null;
  commissionRate: number | null;
  nationalId: string | null;
  banners: string[];
  cityId: string | null;
  provinceId: string | null;
  cityName: string | null;
  provinceName: string | null;

  coachStatus: CoachRequestStatus | null;
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
