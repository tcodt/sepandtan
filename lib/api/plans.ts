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
  // برنامه جدید همیشه active ساخته می‌شود؛ سوییچ مسئول archive قبلی است
  return api.post<Plan>("/plans", {
    ...plan,
    status: plan.status ?? "active",
  });
}

export async function updatePlanStatus(
  planId: string,
  status: "active" | "archived",
): Promise<Plan> {
  return api.patch<Plan>(`/plans/${planId}`, { status });
}

export async function switchActivePlan(input: {
  userId: string;
  previousPlanId?: string | null;
  nextPlanId: string;
}): Promise<Plan> {
  const { userId, previousPlanId, nextPlanId } = input;

  if (previousPlanId && previousPlanId !== nextPlanId) {
    await updatePlanStatus(previousPlanId, "archived");
  }
  const next = await updatePlanStatus(nextPlanId, "active");
  await api.patch(`/users/${userId}`, { currentPlanId: nextPlanId });
  return next;
}

export async function generateAndSavePlan(input: {
  userId: string;
  bodyInfo: BodyInfo;
  equipment: Equipment;
  goal: Goal;
  targetWeight?: number;
}): Promise<{ plan: Plan; userId: string }> {
  // قبل از ساخت برنامه جدید، Active قبلی را archive کن
  try {
    const existing = await getPlansByUser(input.userId);
    const currentActive = existing.find((p) => p.status === "active");
    if (currentActive) {
      await updatePlanStatus(currentActive.id, "archived");
    }
  } catch {
    // ignore اگر لیست خالی بود
  }

  const plan = generatePlan(input);
  const saved = await createPlan({
    ...plan,
    status: "active",
  });

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
  const exact = plan.days?.find((d) => d.dayNumber === dayNumber);
  if (exact) return exact;

  if (!plan.days?.length) return null;
  const idx = (dayNumber - 1) % plan.days.length;
  const fallback = plan.days[idx];
  return { ...fallback, dayNumber };
}

export async function getTodayPlanDay(planId: string) {
  const plan = await getPlanById(planId);
  const dayNumber = getCurrentDayNumber(plan);
  const day = getDayFromPlan(plan, dayNumber);
  if (!day) return null;
  return { plan, day, dayNumber };
}
