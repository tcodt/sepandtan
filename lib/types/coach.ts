/** منبع حقیقت تایپ‌های مربوط به مربی و درخواست همکاری */

export type Coach = {
  id: string;
  userId: string;
  name: string;
  bio: string;
  specialties: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  pricePerPlan: number;
  pricePerConsultation: number;
  avatarUrl?: string;
  verified: boolean;
  isActive: boolean;
  city?: string;
  samplePlans?: string[];
  createdAt: string;
  /** نمایش کمیسیون در MVP (مثلاً "۲۰–۲۵٪") */
  commissionRateDisplay?: string;
  documentsStatus?: "none" | "pending" | "approved" | "rejected";
};

export type CollaborationRequestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

export type CollaborationRequest = {
  id: string; // الزامی
  userId: string;
  coachId: string;
  goal: string;
  message: string;
  status: CollaborationRequestStatus;
  createdAt: string;
  /** بعد از Accept یا Reject پر می‌شود */
  respondedAt?: string | null;
  acceptedAt?: string | null;
  rejectionReason?: string | null;
};
