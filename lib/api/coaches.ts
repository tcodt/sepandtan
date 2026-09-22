import type { Coach, CollaborationRequest } from "@/lib/types/coach";
import type { UserProfile } from "@/lib/types/plan";
import { db } from "./db";
import { createId, delay } from "./client";
import { updateUser } from "./users";

export async function getCoaches(): Promise<Coach[]> {
  await delay();
  return db.coaches
    .filter((c) => c.isActive)
    .map((c) => ({ ...c, specialties: [...c.specialties] }));
}

export async function getCoachById(id: string): Promise<Coach> {
  await delay();
  const coach = db.coaches.find((c) => c.id === id);
  if (!coach) throw new Error(`مربی پیدا نشد: ${id}`);
  return { ...coach, specialties: [...coach.specialties] };
}

/** پیدا کردن پروفایل مربی بر اساس userId (برای داشبورد و Assign) */
export async function getCoachByUserId(userId: string): Promise<Coach | null> {
  await delay();
  const coach = db.coaches.find((c) => c.userId === userId);
  if (!coach) return null;
  return { ...coach, specialties: [...coach.specialties] };
}

export function getCoachByUserIdSync(userId: string): Coach | null {
  const coach = db.coaches.find((c) => c.userId === userId);
  if (!coach) return null;
  return { ...coach, specialties: [...coach.specialties] };
}

/**
 * ایجاد یا به‌روزرسانی پروفایل مربی در db.coaches
 * بعد از Become Coach باید حتماً صدا زده شود تا داشبورد و clients/plans کار کنند.
 */
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
  await delay();

  const existingIndex = db.coaches.findIndex(
    (c) => c.userId === payload.userId,
  );

  if (existingIndex >= 0) {
    const prev = db.coaches[existingIndex];
    const updated: Coach = {
      ...prev,
      name: payload.name,
      bio: payload.bio,
      specialties: [...payload.specialties],
      experienceYears: payload.experienceYears,
      avatarUrl: payload.avatarUrl ?? prev.avatarUrl,
      isActive: true,
      documentsStatus: prev.documentsStatus ?? "none",
    };
    db.coaches[existingIndex] = updated;
    return { ...updated, specialties: [...updated.specialties] };
  }

  const newCoach: Coach = {
    id: createId("coach"),
    userId: payload.userId,
    name: payload.name,
    bio: payload.bio,
    specialties: [...payload.specialties],
    experienceYears: payload.experienceYears,
    rating: 0,
    reviewCount: 0,
    pricePerPlan: 0,
    pricePerConsultation: 0,
    avatarUrl: payload.avatarUrl ?? undefined,
    verified: false,
    isActive: true,
    city: payload.city ?? undefined,
    samplePlans: [],
    createdAt: new Date().toISOString(),
    commissionRateDisplay: "۲۰–۲۵٪",
    documentsStatus: "none",
  };

  db.coaches.push(newCoach);
  return { ...newCoach, specialties: [...newCoach.specialties] };
}

/**
 * ارتقای کامل حساب به مربی:
 * ۱) role در db.users → coach
 * ۲) ساخت/به‌روزرسانی رکورد در db.coaches
 * ۳) برگرداندن کاربر و پروفایل مربی به‌روز
 */
export async function promoteUserToCoach(payload: {
  userId: string;
  specialties: string[];
  experienceYears: number;
  bio: string;
  instagram?: string | null;
  website?: string | null;
}): Promise<{ user: UserProfile; coach: Coach }> {
  await delay();

  const user = db.users.find((u) => u.id === payload.userId);
  if (!user) throw new Error(`کاربر پیدا نشد: ${payload.userId}`);

  // ۱) آپدیت role در db
  const updatedUser = await updateUser(payload.userId, { role: "coach" });

  // ۲) ساخت یا آپدیت پروفایل مربی
  const coach = await upsertCoachProfile({
    userId: payload.userId,
    name: user.name,
    bio: payload.bio,
    specialties: payload.specialties,
    experienceYears: payload.experienceYears,
    avatarUrl: user.avatarUrl,
    instagram: payload.instagram,
    website: payload.website,
  });

  return { user: updatedUser, coach };
}

export async function createCollaborationRequest(
  payload: Omit<CollaborationRequest, "id" | "createdAt" | "status"> & {
    status?: CollaborationRequest["status"];
  },
): Promise<CollaborationRequest> {
  await delay();

  const request: CollaborationRequest = {
    id: createId("req"),
    userId: payload.userId,
    coachId: payload.coachId,
    goal: payload.goal,
    message: payload.message,
    status: payload.status ?? "pending",
    createdAt: new Date().toISOString(),
  };

  db.collaborationRequests.push(request);
  return { ...request };
}

export async function getMyCollaborationRequests(
  userId: string,
): Promise<CollaborationRequest[]> {
  await delay();
  return db.collaborationRequests
    .filter((r) => r.userId === userId)
    .map((r) => ({ ...r }));
}

export async function cancelCollaborationRequest(
  id: string,
): Promise<CollaborationRequest> {
  await delay();
  const index = db.collaborationRequests.findIndex((r) => r.id === id);
  if (index === -1) throw new Error(`درخواست پیدا نشد: ${id}`);

  const updated: CollaborationRequest = {
    ...db.collaborationRequests[index],
    status: "cancelled",
  };
  db.collaborationRequests[index] = updated;
  return { ...updated };
}

export async function deleteCollaborationRequest(id: string): Promise<void> {
  await delay();
  const index = db.collaborationRequests.findIndex((r) => r.id === id);
  if (index === -1) throw new Error(`درخواست پیدا نشد: ${id}`);
  db.collaborationRequests.splice(index, 1);
}

export async function getCoachNameById(
  coachId: string | null | undefined,
): Promise<string | null> {
  if (!coachId) return null;
  await delay(50);
  const coach = db.coaches.find((c) => c.id === coachId);
  return coach?.name ?? null;
}

export function getCoachNameByIdSync(
  coachId: string | null | undefined,
): string | null {
  if (!coachId) return null;
  const coach = db.coaches.find((c) => c.id === coachId);
  return coach?.name ?? null;
}
