/**
 * Map CurrentUserPlan → old PlanAccess shape used by useActivePlan / plans-screen.
 * REMOVE after those screens consume CurrentUserPlan directly.
 */
import type { PlanAccess } from "@/lib/types/access";
import type { CurrentUserPlan, UserPlanListItem } from "./types";

function durationDaysFromRange(
  start: string | null,
  end: string | null,
): 30 | 45 | 90 {
  if (!start || !end) return 30;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b < a) return 30;
  const days = Math.round((b - a) / (1000 * 60 * 60 * 24)) + 1;
  if (days >= 75) return 90;
  if (days >= 40) return 45;
  return 30;
}

function mapStatus(
  plan: CurrentUserPlan | UserPlanListItem,
): PlanAccess["status"] {
  if (plan.status === "ACTIVE") return "active";
  if (plan.status === "COMPLETED" || plan.status === "CANCELLED")
    return "expired";
  return "pending_activation";
}

export function toPlanAccessFromCurrent(
  plan: CurrentUserPlan,
  userId: string,
): PlanAccess {
  return {
    id: plan.id,
    userId,
    planId: plan.id,
    durationDays: durationDaysFromRange(plan.startDate, plan.endDate),
    startDate: plan.startDate,
    endDate: plan.endDate,
    status: mapStatus(plan),
    isRenewal: false,
    purchaseId: plan.id,
    pricePaid: 0,
    createdAt: plan.activatedAt ?? plan.startDate ?? new Date().toISOString(),
    activatedAt: plan.activatedAt,
    planTitle: plan.title,
    planSource:
      plan.source === "COACH" ? "coach" : plan.source === "AI" ? "ai" : "ai",
    coachId: plan.coach?.id ?? null,
    coachName: plan.coach?.name ?? null,
  };
}

export function toPlanAccessFromListItem(
  plan: UserPlanListItem,
  userId: string,
): PlanAccess {
  return {
    id: plan.id,
    userId,
    planId: plan.id,
    durationDays: durationDaysFromRange(plan.startDate, plan.endDate),
    startDate: plan.startDate,
    endDate: plan.endDate,
    status: mapStatus(plan),
    isRenewal: false,
    purchaseId: plan.id,
    pricePaid: 0,
    createdAt: plan.activatedAt ?? plan.startDate ?? new Date().toISOString(),
    activatedAt: plan.activatedAt,
    planTitle: plan.title,
    planSource:
      plan.source === "COACH" ? "coach" : plan.source === "AI" ? "ai" : "ai",
    coachId: plan.coach?.id ?? null,
    coachName: plan.coach?.name ?? null,
  };
}
