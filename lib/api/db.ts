import type {
  UserProfile,
  Plan,
  WorkoutLog,
  NutritionLog,
  WeightLog,
  SubscriptionPlan,
} from "@/lib/types/plan";
import type { Coach, CollaborationRequest } from "@/lib/types/coach";
import type { ClientRelation } from "@/lib/types/client-relation";

import { users as seedUsers } from "@/lib/data/users";
import { plans as seedPlans } from "@/lib/data/plans";
import { coaches as seedCoaches } from "@/lib/data/coaches";
import { collaborationRequests as seedRequests } from "@/lib/data/collaboration-requests";
import { subscriptionPlans as seedSubscriptionPlans } from "@/lib/data/subscription-plans";
import { workoutLogs as seedWorkoutLogs } from "@/lib/data/workout-logs";
import { nutritionLogs as seedNutritionLogs } from "@/lib/data/nutrition-logs";
import { weightLogs as seedWeightLogs } from "@/lib/data/weight-logs";
import { clientRelations as seedClientRelations } from "@/lib/data/client-relations";

/**
 * کپی mutable از دیتای فیک
 * تغییرات create/update فقط در session مرورگر می‌مانند
 */
export const db = {
  users: seedUsers.map((u) => ({ ...u })) as UserProfile[],
  plans: seedPlans.map((p) => ({
    ...p,
    days: p.days.map((d) => ({
      ...d,
      exercises: [...d.exercises],
      meals: [...d.meals],
    })),
  })) as Plan[],
  coaches: seedCoaches.map((c) => ({
    ...c,
    specialties: [...c.specialties],
  })) as Coach[],
  collaborationRequests: seedRequests.map((r) => ({
    ...r,
  })) as CollaborationRequest[],
  clientRelations: seedClientRelations.map((r) => ({
    ...r,
  })) as ClientRelation[],
  subscriptionPlans: seedSubscriptionPlans.map((p) => ({
    ...p,
    features: [...(p.features ?? [])],
  })) as SubscriptionPlan[],
  workoutLogs: seedWorkoutLogs.map((l) => ({
    ...l,
    exercises: l.exercises.map((e) => ({ ...e })),
  })) as WorkoutLog[],
  nutritionLogs: seedNutritionLogs.map((l) => ({
    ...l,
    meals: l.meals.map((m) => ({ ...m })),
  })) as NutritionLog[],
  weightLogs: seedWeightLogs.map((l) => ({ ...l })) as WeightLog[],
};
