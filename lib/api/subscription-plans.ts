import { api } from "./client";
import type { SubscriptionPlan } from "@/lib/types/plan";

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const plans = await api.get<SubscriptionPlan[]>("/subscriptionPlans");
  return (plans || [])
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function getSubscriptionPlanById(
  id: string,
): Promise<SubscriptionPlan | null> {
  try {
    return await api.get<SubscriptionPlan>(`/subscriptionPlans/${id}`);
  } catch {
    const all = await getSubscriptionPlans();
    return all.find((p) => p.id === id) ?? null;
  }
}
