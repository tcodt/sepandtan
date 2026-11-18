export type PlanRequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "PAID"
  | "DELIVERED"
  | "REJECTED"
  | "CANCELLED";

export type PlanRequest = {
  id: string;
  coachId: string;
  userId: string | null;
  status: PlanRequestStatus;
  note: string | null;
  rejectionReason: string | null;
  workoutTemplateId: string | null;
  dietTemplateId: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string | null;
  coachName: string | null;
  raw: Record<string, unknown>;
};

export type CreatePlanRequestInput = {
  coachId: string;
  workoutTemplateId?: string;
  dietTemplateId?: string;
  images?: string[];
  note?: string;
};

export type RejectPlanRequestInput = {
  rejectionReason?: string;
};
