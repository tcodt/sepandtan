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
};

/**
 * ثبت درخواست مربیگری + ارتقای فوری حساب (MVP بدون ادمین)
 * - role در db.users به coach تغییر می‌کند
 * - رکورد در db.coaches ساخته/به‌روز می‌شود
 * - localStorage فقط برای نمایش جزئیات اضافی در Account نگه داشته می‌شود
 */
export async function submitCoachRequest(
  payload: CoachRequestPayload,
): Promise<{ success: true; user: UserProfile; coach: Coach }> {
  // شبیه‌سازی تأخیر شبکه
  await new Promise((r) => setTimeout(r, 500));

  const { user, coach } = await promoteUserToCoach(payload);

  // جزئیات اختیاری (اینستاگرام/سایت) برای بخش Account
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
    // localStorage ممکن است در SSR یا حالت خصوصی در دسترس نباشد — مشکلی نیست
  }

  return { success: true, user, coach };
}
