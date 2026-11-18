/** Aligned with swagger CoachEntity / CoachDetailsEntity / CoachRatingEntity */

export type CoachRating = {
  id: string;
  avgCoachRating: number;
  totalReviews: number;
  completedClients: number;
  activeClients: number;
  avgPlanRating: number;
  avgDietRating: number;
};

export type CoachSpecialty = {
  id: string;
  name: string;
  slug?: string | null;
};

export type CoachListItem = {
  id: string;
  title: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  isAcceptingClients: boolean;
  rating: number;
  reviewCount: number;
  cityName: string | null;
  provinceName: string | null;
  specialties: string[];
  avatarUrl: string | null;
};

export type CoachDetail = CoachListItem & {
  instagram: string | null;
  maxClients: number;
  specialtiesDetailed: CoachSpecialty[];
  coachRating: CoachRating | null;
  workoutPlanIds: string[];
  dietPlanIds: string[];
  raw: Record<string, unknown>;
};

export type MyCoachProfile = {
  id: string;
  title: string;
  slug: string;
  headline: string | null;
  bio: string | null;
  isAcceptingClients: boolean;
  maxClients: number;
  instagram: string | null;
  raw: Record<string, unknown>;
};

export type CreateCoachInput = {
  title: string;
  slug?: string;
  headline?: string;
  bio?: string;
  instagram?: string;
  isAcceptingClients?: boolean;
  maxClients?: number;
  cityId?: string;
  provinceId?: string;
};
