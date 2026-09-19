type CoachRequestPayload = {
  userId: string;
  specialties: string[];
  experienceYears: number;
  bio: string;
  instagram?: string | null;
  website?: string | null;
};

export async function submitCoachRequest(payload: CoachRequestPayload) {
  // شبیه‌سازی تأخیر
  await new Promise((r) => setTimeout(r, 700));

  // ذخیره اطلاعات مربی (موقت در localStorage)
  const key = `coach-profile-${payload.userId}`;
  localStorage.setItem(
    key,
    JSON.stringify({
      ...payload,
      status: "approved", // چون ادمین نداریم
      createdAt: new Date().toISOString(),
    }),
  );

  return { success: true };
}
