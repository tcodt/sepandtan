export type CollaborationRequestStatus = "pending" | "accepted" | "rejected";

export type CollaborationRequest = {
  id: string;
  coachId: string;
  userId: string; // client
  status: CollaborationRequestStatus;
  message?: string;
  createdAt: string;
  respondedAt?: string | null;
  rejectionReason?: string | null;
  acceptedAt?: string | null;
};
