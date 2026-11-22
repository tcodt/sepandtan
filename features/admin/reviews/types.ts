/* ---------- Product reviews (/reviews/admin/all) ---------- */

export type AdminProductReviewItem = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  answer: string | null;
  isApproved: boolean | null;
  verifiedPurchase: boolean;
  userId: string | null;
  userName: string | null;
  productId: string | null;
  productName: string | null;
  createdAt: string | null;
};

export type AdminProductReviewFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  /** true | false | ALL */
  isApproved?: boolean | "ALL";
  productId?: string;
};

/* ---------- Coach reviews (/coach/review/admin) ---------- */

export type CoachReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

export type AdminCoachReviewItem = {
  id: string;
  status: CoachReviewStatus;
  body: string | null;
  coachRating: number | null;
  planRating: number | null;
  dietRating: number | null;
  isAnonymous: boolean;
  answerReview: string | null;
  coachId: string | null;
  coachName: string | null;
  authorName: string | null;
  createdAt: string | null;
};

export type AdminCoachReviewFilters = {
  page?: number;
  limit?: number;
  order?: "asc" | "desc";
  status?: CoachReviewStatus | "ALL";
  coachId?: string;
};

export type AdminListResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
