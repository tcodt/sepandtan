import type { SubscriptionPlan } from "@/lib/types/plan";
import { db } from "./db";
import { delay } from "./client";

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  await delay();
  return db.subscriptionPlans
    .filter((p) => p.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((p) => ({ ...p, features: [...p.features] }));
}

export async function getSubscriptionPlanById(
  id: string,
): Promise<SubscriptionPlan | null> {
  await delay();
  const plan = db.subscriptionPlans.find((p) => p.id === id);
  return plan ? { ...plan, features: [...plan.features] } : null;
}
