/**
 * Compatibility layer for PlanAccess.
 * Reads come from real /user-plan/* .
 * Writes (createPlanAccessForPlan) are stubs until onboarding migrates off local generatePlan.
 *
 * REMOVE after:
 * - hooks/use-user-plan-accesses.ts → useMyUserPlans
 * - hooks/use-active-plan.ts → useCurrentUserPlan
 * - components/plans/plans-screen.tsx
 * - lib/api/plans.ts no longer calls createPlanAccessForPlan
 */
import type { PlanAccess } from "@/lib/types/access";
import type { Plan } from "@/lib/types/plan";
import {
  fetchCurrentUserPlan,
  fetchMyUserPlans,
} from "@/features/user-plan/api";
import {
  toPlanAccessFromCurrent,
  toPlanAccessFromListItem,
} from "@/features/user-plan/adapters";

export async function getUserPlanAccesses(
  userId: string,
): Promise<PlanAccess[]> {
  const plans = await fetchMyUserPlans();
  return plans.map((p) => toPlanAccessFromListItem(p, userId));
}

export async function getActivePlanAccess(
  userId: string,
): Promise<PlanAccess | null> {
  const current = await fetchCurrentUserPlan();
  if (!current) return null;
  return toPlanAccessFromCurrent(current, userId);
}

export async function getPlanAccessById(
  id: string,
): Promise<PlanAccess | null> {
  const plans = await fetchMyUserPlans();
  const found = plans.find((p) => p.id === id);
  if (!found) return null;
  return toPlanAccessFromListItem(found, found.coach?.id ?? "");
}

/**
 * @deprecated Training plan activation is owned by backend user-plan + service-order.
 * Kept so generateAndSavePlan does not crash until onboarding is migrated.
 */
export async function createPlanAccessForPlan(input: {
  userId: string;
  plan: Plan;
  durationDays: number;
  pricePaid: number;
  status: PlanAccess["status"];
}): Promise<PlanAccess> {
  console.warn(
    "[access] createPlanAccessForPlan is deprecated — use user-plan / service-order APIs",
    input.plan.id,
  );
  return {
    id: input.plan.id,
    userId: input.userId,
    planId: input.plan.id,
    durationDays: (input.durationDays === 45
      ? 45
      : input.durationDays === 90
        ? 90
        : 30) as 30 | 45 | 90,
    startDate: null,
    endDate: null,
    status: input.status,
    isRenewal: false,
    purchaseId: input.plan.id,
    pricePaid: input.pricePaid,
    createdAt: new Date().toISOString(),
    planTitle: input.plan.title ?? input.plan.id,
    planSource: "ai",
  };
}

export async function activatePlanAccess(
  id: string,
): Promise<PlanAccess | null> {
  console.warn(
    "[access] activatePlanAccess is deprecated — coach activates via /user-plan/coach/{id}/activate",
    id,
  );
  return getPlanAccessById(id);
}
