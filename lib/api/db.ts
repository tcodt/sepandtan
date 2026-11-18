import type { UserProfile, Plan } from "@/lib/types/plan";
import type { ClientRelation } from "@/lib/types/client-relation";

import { users as seedUsers } from "@/lib/data/users";
import { plans as seedPlans } from "@/lib/data/plans";
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
  clientRelations: seedClientRelations.map((r) => ({
    ...r,
  })) as ClientRelation[],
};
