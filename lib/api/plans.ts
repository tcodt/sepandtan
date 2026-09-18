import type {
  Plan,
  PlanDay,
  BodyInfo,
  Equipment,
  Goal,
} from "@/lib/types/plan";
import { generatePlan } from "@/lib/plan/generate-plan";
import { completeUserOnboarding } from "./users";
import { db } from "./db";
import { createId, delay } from "./client";

export async function getPlanById(id: string): Promise<Plan> {
  await delay();
  const plan = db.plans.find((p) => p.id === id);
  if (!plan) throw new Error(`برنامه پیدا نشد: ${id}`);
  return structuredClone(plan);
}

export async function getPlansByUser(userId: string): Promise<Plan[]> {
  await delay();
  return db.plans
    .filter((p) => p.userId === userId)
    .map((p) => structuredClone(p));
}

export async function createPlan(plan: Plan): Promise<Plan> {
  await delay();

  // فقط یک active برای هر کاربر
  if (plan.status === "active") {
    db.plans.forEach((p, i) => {
      if (p.userId === plan.userId && p.status === "active") {
        db.plans[i] = { ...p, status: "archived" };
      }
    });
  }

  const saved: Plan = {
    ...structuredClone(plan),
    id: plan.id || createId("plan"),
    createdAt: plan.createdAt || new Date().toISOString(),
  };

  db.plans.push(saved);
  return structuredClone(saved);
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
  // برنامه‌هایی که هنوز Activate نشده‌اند (startDate = null)
  if (!plan.startDate) return 1;

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
  // پشتیبانی الگوی هفتگی مربی
  if (
    plan.patternType === "weekly" &&
    Array.isArray(plan.weeklyTemplate) &&
    plan.weeklyTemplate.length === 7
  ) {
    const dayInCycle = ((dayNumber - 1) % 7) + 1;
    return plan.weeklyTemplate.find((d) => d.dayNumber === dayInCycle) ?? null;
  }

  // رفتار قبلی برای برنامه‌های AI و برنامه‌های قدیمی مربی
  return plan.days.find((d) => d.dayNumber === dayNumber) ?? null;
}

export async function getTodayPlanDay(planId: string) {
  const plan = await getPlanById(planId);
  const dayNumber = getCurrentDayNumber(plan);
  const day = getDayFromPlan(plan, dayNumber);
  if (!day) return null;
  return { plan, day, dayNumber };
}

/**
 * سوییچ برنامه فعال کاربر
 * پشتیبانی از:
 *   switchActivePlan(userId, planId)
 *   switchActivePlan({ userId, planId, previousPlanId?, nextPlanId? })
 *
 * اگر nextPlanId داده شود، همان به‌عنوان planId استفاده می‌شود.
 */
export async function switchActivePlan(
  userIdOrPayload:
    | string
    | {
        userId: string;
        planId?: string;
        nextPlanId?: string;
        previousPlanId?: string | null;
      },
  maybePlanId?: string,
): Promise<Plan> {
  await delay();

  let userId: string;
  let planId: string | undefined;

  if (typeof userIdOrPayload === "string") {
    userId = userIdOrPayload;
    planId = maybePlanId;
  } else {
    userId = userIdOrPayload.userId;
    planId = userIdOrPayload.nextPlanId ?? userIdOrPayload.planId;
  }

  if (!userId || !planId) {
    throw new Error("userId و planId الزامی هستند");
  }

  const target = db.plans.find((p) => p.id === planId && p.userId === userId);
  if (!target) throw new Error("برنامه پیدا نشد");

  db.plans.forEach((p, i) => {
    if (p.userId !== userId) return;
    db.plans[i] = {
      ...p,
      status: p.id === planId ? "active" : "archived",
    };
  });

  const userIndex = db.users.findIndex((u) => u.id === userId);
  if (userIndex !== -1) {
    db.users[userIndex] = {
      ...db.users[userIndex],
      currentPlanId: planId,
      updatedAt: new Date().toISOString(),
    };
  }

  const updated = db.plans.find((p) => p.id === planId)!;
  return structuredClone(updated);
}
