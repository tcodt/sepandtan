import type { CoachSale, CoachEarningsSummary } from "@/lib/types/access";

export const COACH_SALES: CoachSale[] = [
  {
    id: "sale_1",
    coachId: "coach_user_1",
    userId: "user_demo_1",
    userName: "علی رضایی",
    planId: "plan_ali_coach_1",
    planTitle: "برنامه کاهش وزن مربی مهدی",
    planAccessId: "access_ali_1",
    amount: 1_250_000,
    commissionRate: 0.22,
    commissionAmount: 275_000,
    status: "completed",
    createdAt: "2026-08-28T14:00:00.000Z",
    paidAt: "2026-08-28T14:00:00.000Z",
  },
  {
    id: "sale_2",
    coachId: "coach_user_1",
    userId: "user_demo_x",
    userName: "مریم حسینی",
    planId: "plan_ali_coach_1",
    planTitle: "برنامه کاهش وزن مربی مهدی",
    planAccessId: "access_x_1",
    amount: 1_100_000,
    commissionRate: 0.22,
    commissionAmount: 242_000,
    status: "completed",
    createdAt: "2026-09-12T11:20:00.000Z",
    paidAt: "2026-09-12T11:20:00.000Z",
  },
];

export const COACH_EARNINGS_SUMMARY: CoachEarningsSummary = {
  coachId: "coach_user_1",
  currentMonthRevenue: 242_000,
  currentMonthSalesCount: 1,
  totalCommission: 517_000,
  availableForWithdrawal: 517_000,
  withdrawalStatus: "available",
  lastUpdated: "2026-09-28T18:00:00.000Z",
};

export function getSalesByCoach(coachId: string): CoachSale[] {
  return COACH_SALES.filter((s) => s.coachId === coachId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function getCoachEarningsSummary(
  coachId: string,
): CoachEarningsSummary | null {
  if (coachId === COACH_EARNINGS_SUMMARY.coachId) return COACH_EARNINGS_SUMMARY;
  return null;
}
