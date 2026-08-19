import { api } from "./client";
import type {
  Plan,
  PlanDay,
  BodyInfo,
  Equipment,
  Goal,
} from "@/lib/types/plan";
import { generatePlan } from "@/lib/plan/generate-plan";
import { completeUserOnboarding } from "./users";

export async function getPlanById(id: string): Promise<Plan> {
  return api.get<Plan>(`/plans/${id}`);
}

export async function getPlansByUser(userId: string): Promise<Plan[]> {
  return api.get<Plan[]>(`/plans?userId=${encodeURIComponent(userId)}`);
}

export async function createPlan(plan: Plan): Promise<Plan> {
  return api.post<Plan>("/plans", plan);
}

/** ساخت برنامه + ذخیره + آپدیت کاربر */
export async function generateAndSavePlan(input: {
  userId: string;
  bodyInfo: BodyInfo;
  equipment: Equipment;
  goal: Goal;
  targetWeight?: number;
}): Promise<{ plan: Plan; userId: string }> {
  const plan = generatePlan(input);
  const saved = await createPlan(plan);

  await completeUserOnboarding(input.userId, {
    bodyInfo: input.bodyInfo,
    equipment: input.equipment,
    goal: input.goal,
    currentPlanId: saved.id,
    targetWeight: input.targetWeight,
  });

  return { plan: saved, userId: input.userId };
}

export function getCurrentDayNumber(plan: Plan, today = new Date()): number {
  const start = new Date(plan.startDate);
  start.setHours(0, 0, 0, 0);
  const current = new Date(today);
  current.setHours(0, 0, 0, 0);

  const diff = Math.floor(
    (current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  const day = diff + 1;

  if (day < 1) return 1;
  if (day > plan.durationDays) return plan.durationDays;
  return day;
}

export function getDayFromPlan(plan: Plan, dayNumber: number): PlanDay | null {
  const exact = plan.days.find((d) => d.dayNumber === dayNumber);
  if (exact) return exact;

  // اگر days کامل ۳۰ روز نبود (مثل دیتای دمو)، از الگوی موجود استفاده کن
  if (!plan.days.length) return null;
  const idx = (dayNumber - 1) % plan.days.length;
  const fallback = plan.days[idx];
  return {
    ...fallback,
    dayNumber, // شماره واقعی روز حفظ شود
  };
}

export async function getTodayPlanDay(planId: string) {
  const plan = await getPlanById(planId);
  const dayNumber = getCurrentDayNumber(plan);
  const day = getDayFromPlan(plan, dayNumber);
  if (!day) return null;
  return { plan, day, dayNumber };
}
