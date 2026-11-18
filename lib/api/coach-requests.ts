import { promoteUserToCoach } from "./coaches";
import type { Coach } from "@/lib/types/coach";
import type { UserProfile } from "@/lib/types/plan";

type CoachRequestPayload = {
  userId: string;
  specialties: string[];
  experienceYears: number;
  bio: string;
  instagram?: string | null;
  website?: string | null;
  name?: string;
};

/**
 * Become coach → create coach profile on backend + activate local coach role.
 */
export async function submitCoachRequest(
  payload: CoachRequestPayload,
): Promise<{ success: true; user: UserProfile; coach: Coach }> {
  const { user, coach } = await promoteUserToCoach(payload);

  try {
    const key = `coach-profile-${payload.userId}`;
    localStorage.setItem(
      key,
      JSON.stringify({
        specialties: payload.specialties,
        experienceYears: payload.experienceYears,
        bio: payload.bio,
        instagram: payload.instagram ?? null,
        website: payload.website ?? null,
        status: "approved",
        createdAt: new Date().toISOString(),
        coachId: coach.id,
      }),
    );
  } catch {
    // ignore
  }

  return { success: true, user, coach };
}
