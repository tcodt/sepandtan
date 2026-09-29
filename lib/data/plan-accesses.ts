import type { PlanAccess } from "@/lib/types/access";

export const PLAN_ACCESSES: PlanAccess[] = [
  {
    id: "access_ali_1",
    userId: "user_demo_1",
    planId: "plan_ali_coach_1",
    durationDays: 45,
    startDate: "2026-09-01T00:00:00.000Z",
    endDate: "2026-10-16T00:00:00.000Z",
    status: "active",
    isRenewal: false,
    purchaseId: "pay_ali_1",
    pricePaid: 1_250_000,
    createdAt: "2026-08-28T14:00:00.000Z",
    activatedAt: "2026-09-01T08:00:00.000Z",
    planTitle: "برنامه کاهش وزن مربی مهدی",
    planSource: "coach",
    coachId: "coach_user_1",
    coachName: "مهدی احمدی",
  },
  {
    id: "access_reza_1",
    userId: "user_demo_3",
    planId: "plan_reza_ai_1",
    durationDays: 45,
    startDate: "2026-09-05T00:00:00.000Z",
    endDate: "2026-10-20T00:00:00.000Z",
    status: "active",
    isRenewal: false,
    purchaseId: "pay_reza_1",
    pricePaid: 499_000,
    createdAt: "2026-09-05T09:00:00.000Z",
    activatedAt: "2026-09-05T09:15:00.000Z",
    planTitle: "برنامه عضله‌سازی هوش مصنوعی",
    planSource: "ai",
    coachId: null,
    coachName: null,
  },
  {
    id: "access_ali_old",
    userId: "user_demo_1",
    planId: "plan_sample_ai_30",
    durationDays: 30,
    startDate: "2026-07-01T00:00:00.000Z",
    endDate: "2026-07-31T00:00:00.000Z",
    status: "expired",
    isRenewal: false,
    purchaseId: "pay_ali_old",
    pricePaid: 349_000,
    createdAt: "2026-06-28T10:00:00.000Z",
    activatedAt: "2026-07-01T00:00:00.000Z",
    planTitle: "برنامه عمومی مبتدی",
    planSource: "ai",
    coachId: null,
    coachName: null,
  },
  {
    id: "access_pending_1",
    userId: "user_demo_3",
    planId: "plan_sample_ai_30",
    durationDays: 30,
    startDate: null,
    endDate: null,
    status: "pending_activation",
    isRenewal: false,
    purchaseId: "pay_reza_pending",
    pricePaid: 349_000,
    createdAt: "2026-09-25T16:00:00.000Z",
    activatedAt: null,
    planTitle: "برنامه عمومی مبتدی",
    planSource: "ai",
    coachId: null,
    coachName: null,
  },
];

export function getAccessesByUser(userId: string): PlanAccess[] {
  return PLAN_ACCESSES.filter((a) => a.userId === userId);
}

export function getActiveAccess(userId: string): PlanAccess | undefined {
  return PLAN_ACCESSES.find(
    (a) => a.userId === userId && a.status === "active",
  );
}

export function getAccessById(id: string): PlanAccess | undefined {
  return PLAN_ACCESSES.find((a) => a.id === id);
}
