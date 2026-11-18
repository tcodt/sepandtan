/**
 * Compatibility layer → real backend via features/subscription
 *
 * REMOVE this file when these import from features/subscription directly:
 * - components/common/plans.tsx
 * - components/checkout/checkout-screen.tsx
 * - components/account/account-subscription-section.tsx
 * - components/account/account-summary-cards.tsx
 * - components/dashboard/active-plan-card.tsx
 * - components/plans/active-plan-card.tsx
 */
import type { SubscriptionPlan } from "@/lib/types/plan";
import {
  fetchSubscriptionPlanById,
  fetchSubscriptionPlans,
} from "@/features/subscription/api";
import { toUiSubscriptionPlan } from "@/features/subscription/adapters";

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { plans } = await fetchSubscriptionPlans();
  return plans.map(toUiSubscriptionPlan);
}

export async function getSubscriptionPlanById(
  id: string,
): Promise<SubscriptionPlan | null> {
  const dto = await fetchSubscriptionPlanById(id);
  return dto ? toUiSubscriptionPlan(dto) : null;
}
