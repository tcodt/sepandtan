export type ClientRelationStatus = "active" | "paused" | "ended";

export type ClientRelation = {
  id: string;
  coachId: string;
  clientId: string;
  status: ClientRelationStatus;
  collaborationRequestId: string;
  startedAt: string;
  endedAt?: string | null;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
};
