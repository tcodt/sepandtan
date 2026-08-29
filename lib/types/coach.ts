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
};

export type CollaborationRequest = {
  id?: string;
  userId: string;
  coachId: string;
  goal: string;
  message: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
};
