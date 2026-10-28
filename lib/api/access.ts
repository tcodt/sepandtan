import { createId } from "./client";
import type { PlanAccess } from "@/lib/types/access";
import { PLAN_ACCESSES } from "@/lib/data/plan-accesses";
import { Plan } from "../types/plan";

function delay(ms = 280): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** کپی در حافظه برای عملیات write در MVP */
let accesses: PlanAccess[] = [...PLAN_ACCESSES];

export async function getUserPlanAccesses(
  userId: string,
): Promise<PlanAccess[]> {
  await delay();
  return accesses
    .filter((a) => a.userId === userId)
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export async function getActivePlanAccess(
  userId: string,
): Promise<PlanAccess | null> {
  await delay();
  return (
    accesses.find((a) => a.userId === userId && a.status === "active") ?? null
  );
}

export async function getPlanAccessById(
  id: string,
): Promise<PlanAccess | null> {
  await delay();
  return accesses.find((a) => a.id === id) ?? null;
}

/**
 * فعال‌سازی یک دسترسی pending
 * قانون قفل‌شده: فقط یک Active Plan مجاز است → قبلی‌ها expired می‌شوند
 */
export async function activatePlanAccess(
  accessId: string,
  userId: string,
): Promise<PlanAccess> {
  await delay(400);

  const target = accesses.find((a) => a.id === accessId && a.userId === userId);
  if (!target) throw new Error("دسترسی پیدا نشد");
  if (target.status === "expired") {
    throw new Error("این دسترسی منقضی شده و قابل فعال‌سازی نیست");
  }
  if (target.status === "active") return target;

  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() + target.durationDays);

  accesses = accesses.map((a) => {
    if (a.userId === userId && a.status === "active") {
      return { ...a, status: "expired" as const };
    }
    if (a.id === accessId) {
      return {
        ...a,
        status: "active" as const,
        startDate: now.toISOString(),
        endDate: end.toISOString(),
        activatedAt: now.toISOString(),
      };
    }
    return a;
  });

  return accesses.find((a) => a.id === accessId)!;
}

/** فقط برای تست */
export function __resetPlanAccesses() {
  accesses = [...PLAN_ACCESSES];
}

/**
 * ساخت PlanAccess برای برنامه (مثلاً بعد از آنبوردینگ رایگان)
 */
export async function createPlanAccessForPlan(input: {
  userId: string;
  plan: Plan;
  durationDays?: 30 | 45 | 90;
  pricePaid?: number;
  status?: "active" | "pending_activation";
}): Promise<PlanAccess> {
  await delay(200);

  const now = new Date();
  const durationDays = input.durationDays ?? 30;
  const status = input.status ?? "active";

  const end = new Date(now);
  end.setDate(end.getDate() + durationDays);

  // اگر active است، بقیه activeهای همین کاربر را expired کن
  if (status === "active") {
    accesses = accesses.map((a) =>
      a.userId === input.userId && a.status === "active"
        ? { ...a, status: "expired" as const }
        : a,
    );
  }

  const access: PlanAccess = {
    id: createId("access"),
    userId: input.userId,
    planId: input.plan.id,
    durationDays,
    startDate: status === "active" ? now.toISOString() : null,
    endDate: status === "active" ? end.toISOString() : null,
    status,
    isRenewal: false,
    purchaseId: createId("pay"),
    pricePaid: input.pricePaid ?? 0,
    createdAt: now.toISOString(),
    activatedAt: status === "active" ? now.toISOString() : null,
    planTitle: input.plan.title,
    planSource: input.plan.source,
    coachId: input.plan.coachId ?? null,
    coachName: null,
  };

  accesses = [access, ...accesses];
  return { ...access };
}

/**
 * اگر کاربر currentPlanId دارد ولی Access ندارد، یکی بساز (همگام‌سازی)
 */
export async function ensureAccessForCurrentPlan(input: {
  userId: string;
  planId: string;
  planTitle?: string;
  planSource?: "ai" | "coach";
  durationDays?: 30 | 45 | 90;
}): Promise<PlanAccess | null> {
  await delay(100);

  const existing = accesses.find(
    (a) =>
      a.userId === input.userId &&
      a.planId === input.planId &&
      (a.status === "active" || a.status === "pending_activation"),
  );
  if (existing) return { ...existing };

  const now = new Date();
  const durationDays = input.durationDays ?? 30;
  const end = new Date(now);
  end.setDate(end.getDate() + durationDays);

  accesses = accesses.map((a) =>
    a.userId === input.userId && a.status === "active"
      ? { ...a, status: "expired" as const }
      : a,
  );

  const access: PlanAccess = {
    id: createId("access"),
    userId: input.userId,
    planId: input.planId,
    durationDays,
    startDate: now.toISOString(),
    endDate: end.toISOString(),
    status: "active",
    isRenewal: false,
    purchaseId: createId("pay"),
    pricePaid: 0,
    createdAt: now.toISOString(),
    activatedAt: now.toISOString(),
    planTitle: input.planTitle,
    planSource: input.planSource ?? "ai",
    coachId: null,
    coachName: null,
  };

  accesses = [access, ...accesses];
  return { ...access };
}
