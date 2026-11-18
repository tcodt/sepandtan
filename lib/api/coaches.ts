/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Compatibility layer over real coach + plan-request APIs.
 * NO db.coaches / delay for catalog & collaboration.
 *
 * REMOVE when UI imports features/coaches and features/plan-request directly.
 */
import type { Coach, CollaborationRequest } from "@/lib/types/coach";
import type { UserProfile } from "@/lib/types/plan";
import {
  createCoachProfile,
  fetchCoachBySlug,
  fetchMyCoachProfile,
  fetchPublicCoaches,
  updateCoachProfile,
} from "@/features/coaches/api";
import {
  toLegacyCoach,
  toLegacyCoachFromMy,
} from "@/features/coaches/adapters";
import {
  cancelPlanRequest,
  createPlanRequest,
  deleteMyPlanRequest,
  fetchMyPlanRequests,
} from "@/features/plan-request/api";
import type { PlanRequest } from "@/features/plan-request/types";
import { mapProfileResponseToUser } from "@/lib/api/mappers/user";

function mapStatus(
  status: PlanRequest["status"],
): CollaborationRequest["status"] {
  switch (status) {
    case "ACCEPTED":
    case "PAID":
    case "DELIVERED":
      return "accepted";
    case "REJECTED":
      return "rejected";
    case "CANCELLED":
      return "cancelled";
    case "PENDING":
    default:
      return "pending";
  }
}

function toCollaborationRequest(req: PlanRequest): CollaborationRequest {
  return {
    id: req.id,
    userId: req.userId ?? "",
    coachId: req.coachId,
    goal: "",
    message: req.note ?? "",
    status: mapStatus(req.status),
    createdAt: req.createdAt,
    respondedAt: req.updatedAt,
    rejectionReason: req.rejectionReason,
  };
}

/** Public catalog — GET /catalog/coach */
export async function getCoaches(): Promise<Coach[]> {
  const list = await fetchPublicCoaches({ limit: 50 });
  return list.map((c) => toLegacyCoach(c));
}

/** Detail by id or slug — GET /catalog/coach/{slug} */
export async function getCoachById(id: string): Promise<Coach> {
  const detail = await fetchCoachBySlug(id);
  return toLegacyCoach(detail);
}

/** Current user's coach profile — GET /coach/my */
export async function getCoachByUserId(userId: string): Promise<Coach | null> {
  const profile = await fetchMyCoachProfile();
  if (!profile) return null;
  return toLegacyCoachFromMy(profile, userId);
}

/**
 * @deprecated Sync db is gone. Returns null.
 * Migrate callers to async getCoachByUserId / useMyCoachProfile.
 */
export function getCoachByUserIdSync(_userId: string): Coach | null {
  return null;
}

/**
 * @deprecated Sync db is gone. Returns null.
 * Migrate callers to getCoachById / getCoachNameById (async).
 */
export function getCoachNameByIdSync(
  _coachId: string | null | undefined,
): string | null {
  return null;
}

export async function getCoachNameById(
  coachId: string | null | undefined,
): Promise<string | null> {
  if (!coachId) return null;
  try {
    const coach = await getCoachById(coachId);
    return coach.name ?? null;
  } catch {
    return null;
  }
}

export async function upsertCoachProfile(payload: {
  userId: string;
  name: string;
  bio: string;
  specialties: string[];
  experienceYears: number;
  avatarUrl?: string | null;
  instagram?: string | null;
  website?: string | null;
  city?: string | null;
}): Promise<Coach> {
  void payload.specialties;
  void payload.experienceYears;
  void payload.avatarUrl;
  void payload.website;
  void payload.city;

  const existing = await fetchMyCoachProfile();
  if (existing) {
    const updated = await updateCoachProfile(existing.id, {
      title: payload.name,
      bio: payload.bio,
      instagram: payload.instagram ?? undefined,
      isAcceptingClients: true,
    });
    return toLegacyCoachFromMy(updated, payload.userId);
  }

  const created = await createCoachProfile({
    title: payload.name,
    bio: payload.bio,
    instagram: payload.instagram ?? undefined,
    isAcceptingClients: true,
  });
  return toLegacyCoachFromMy(created, payload.userId);
}

/** POST /plan-request */
export async function createCollaborationRequest(input: {
  userId: string;
  coachId: string;
  goal: string;
  message: string;
}): Promise<CollaborationRequest> {
  void input.userId;
  const created = await createPlanRequest({
    coachId: input.coachId,
    note: [input.goal, input.message].filter(Boolean).join("\n"),
  });
  return toCollaborationRequest(created);
}

/** GET /plan-request/my */
export async function getMyCollaborationRequests(
  userId: string,
): Promise<CollaborationRequest[]> {
  void userId;
  const list = await fetchMyPlanRequests();
  return list.map(toCollaborationRequest);
}

/** PATCH /plan-request/{id}/cancel */
export async function cancelCollaborationRequest(
  id: string,
): Promise<CollaborationRequest> {
  const updated = await cancelPlanRequest(id);
  return toCollaborationRequest(updated);
}

/** DELETE /plan-request/my/{requestId} */
export async function deleteCollaborationRequest(id: string): Promise<void> {
  await deleteMyPlanRequest(id);
}

/**
 * Promote / create coach profile.
 * Backend may still return role=USER until admin approval.
 * Locally we mark coach+approved so /coach layout opens.
 * Sync again from GET /user/profile when backend is source of truth.
 */
export async function promoteUserToCoach(payload: {
  userId: string;
  specialties: string[];
  experienceYears: number;
  bio: string;
  instagram?: string | null;
  website?: string | null;
  name?: string;
}): Promise<{ user: UserProfile; coach: Coach }> {
  const displayName = payload.name?.trim() || "مربی";

  const coach = await upsertCoachProfile({
    userId: payload.userId,
    name: displayName,
    bio: payload.bio,
    specialties: payload.specialties,
    experienceYears: payload.experienceYears,
    instagram: payload.instagram,
    website: payload.website,
  });

  // Prefer backend profile, but FORCE coach access flags for panel
  let base: UserProfile | null = null;
  try {
    const { getMyProfile } = await import("@/lib/api/auth");
    const res = await getMyProfile();
    base = mapProfileResponseToUser(res);
  } catch {
    base = null;
  }

  const user: UserProfile = {
    ...(base ?? {
      id: payload.userId,
      name: displayName,
      email: undefined,
      phone: undefined,
      roles: ["coach"],
      accountStatus: "ACTIVE",
      professionalRoleLock: "coach",
      onboardingCompleted: true,
      onboardingStatus: "completed",
      currentOnboardingStep: 0,
      subscriptionStatus: "free",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }),
    id: payload.userId,
    name: base?.name || displayName,
    role: "coach",
    roles: Array.from(
      new Set([...(base?.roles ?? []), "coach" as const]),
    ) as UserProfile["roles"],
    roleStatus: "approved",
    professionalRoleLock: "coach",
  };

  return { user, coach };
}

export async function getOrCreateCoachProfileForUser(input: {
  userId: string;
  name: string;
  avatarUrl?: string;
}): Promise<Coach> {
  void input.avatarUrl;

  const existing = await fetchMyCoachProfile();
  if (existing) return toLegacyCoachFromMy(existing, input.userId);

  // Create only if missing — do not swallow 403 (not a coach yet)
  try {
    return await upsertCoachProfile({
      userId: input.userId,
      name: input.name || "مربی",
      bio: "مربی سپندتن",
      specialties: [],
      experienceYears: 0,
    });
  } catch (err) {
    console.error("[getOrCreateCoachProfileForUser]", err);
    throw err;
  }
}
