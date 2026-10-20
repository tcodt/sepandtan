import type { PlanAccess } from "@/lib/types/access";
import { PLAN_ACCESSES } from "@/lib/data/plan-accesses";

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
