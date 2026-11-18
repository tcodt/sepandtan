import type { Coach } from "@/lib/types/coach";
import type { CoachDetail, CoachListItem, MyCoachProfile } from "./types";

export function toLegacyCoach(
  item: CoachListItem | CoachDetail,
  userId = "",
): Coach {
  return {
    id: item.id,
    userId,
    name: item.title,
    bio: item.bio ?? item.headline ?? "",
    specialties: [...item.specialties],
    experienceYears: 0,
    rating: item.rating,
    reviewCount: item.reviewCount,
    pricePerPlan: 0,
    pricePerConsultation: 0,
    avatarUrl: item.avatarUrl ?? undefined,
    verified: item.rating > 0,
    isActive: item.isAcceptingClients,
    city: item.cityName ?? undefined,
    createdAt: new Date().toISOString(),
  };
}

export function toLegacyCoachFromMy(
  profile: MyCoachProfile,
  userId: string,
): Coach {
  return {
    id: profile.id,
    userId,
    name: profile.title,
    bio: profile.bio ?? profile.headline ?? "",
    specialties: [],
    experienceYears: 0,
    rating: 0,
    reviewCount: 0,
    pricePerPlan: 0,
    pricePerConsultation: 0,
    avatarUrl: undefined,
    verified: false,
    isActive: profile.isAcceptingClients,
    createdAt: new Date().toISOString(),
  };
}
