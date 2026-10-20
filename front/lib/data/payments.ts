import type { Payment } from "@/lib/types/access";

export const PAYMENTS: Payment[] = [
  {
    id: "pay_ali_1",
    userId: "user_demo_1",
    type: "plan_access",
    amount: 1_250_000,
    status: "paid",
    description: "خرید دسترسی ۴۵ روزه به برنامه مربی مهدی",
    planAccessId: "access_ali_1",
    planId: "plan_ali_coach_1",
    durationDays: 45,
    createdAt: "2026-08-28T13:50:00.000Z",
    paidAt: "2026-08-28T13:52:00.000Z",
  },
  {
    id: "pay_ali_old",
    userId: "user_demo_1",
    type: "plan_access",
    amount: 349_000,
    status: "paid",
    description: "خرید دسترسی ۳۰ روزه به برنامه عمومی",
    planAccessId: "access_ali_old",
    planId: "plan_sample_ai_30",
    durationDays: 30,
    createdAt: "2026-06-28T09:40:00.000Z",
    paidAt: "2026-06-28T09:42:00.000Z",
  },
  {
    id: "pay_reza_1",
    userId: "user_demo_3",
    type: "subscription",
    amount: 499_000,
    status: "paid",
    description: "اشتراک پرو ۴۵ روزه",
    planAccessId: "access_reza_1",
    planId: "plan_reza_ai_1",
    durationDays: 45,
    createdAt: "2026-09-05T08:55:00.000Z",
    paidAt: "2026-09-05T08:57:00.000Z",
  },
  {
    id: "pay_reza_pending",
    userId: "user_demo_3",
    type: "plan_access",
    amount: 349_000,
    status: "paid",
    description: "خرید دسترسی ۳۰ روزه (در انتظار فعال‌سازی)",
    planAccessId: "access_pending_1",
    planId: "plan_sample_ai_30",
    durationDays: 30,
    createdAt: "2026-09-25T15:50:00.000Z",
    paidAt: "2026-09-25T15:52:00.000Z",
  },
];

export function getPaymentsByUser(userId: string): Payment[] {
  return PAYMENTS.filter((p) => p.userId === userId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
