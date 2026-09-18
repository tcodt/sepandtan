import type { UserProfile } from "@/lib/types/plan";

/**
 * کاربران تست
 * - سارا: free بدون برنامه
 * - علی: coach_plan + برنامه coach فعال
 * - رضا: basic + برنامه AI فعال + archived
 * - سه کاربر نقش coach برای اتصال به coaches
 */
export const users: UserProfile[] = [
  {
    id: "user_demo_1",
    name: "علی رضایی",
    email: "ali@sepandtan.test",
    phone: "09121234567",
    password: "123456",
    role: "user",
    avatarUrl: "/images/athlete-1.jpg",
    bodyInfo: {
      gender: "male",
      age: 28,
      height: 178,
      weight: 80.2,
      activityLevel: "moderate",
    },
    equipment: "both",
    goal: "lose_weight",
    onboardingCompleted: true,
    currentPlanId: "plan_ali_coach_1",

    subscriptionStatus: "coach_plan",
    targetWeight: 75,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-28T14:00:00.000Z",
  },
  {
    id: "user_demo_2",
    name: "سارا محمدی",
    email: "sara@sepandtan.test",
    phone: "09129876543",
    password: "123456",
    role: "user",
    avatarUrl: undefined,
    bodyInfo: undefined,
    equipment: undefined,
    goal: undefined,
    onboardingCompleted: false,
    currentPlanId: null,

    subscriptionStatus: "free",
    targetWeight: undefined,
    createdAt: "2026-08-10T12:00:00.000Z",
    updatedAt: "2026-08-10T12:00:00.000Z",
  },
  {
    id: "user_demo_3",
    name: "رضا کریمی",
    email: "reza@sepandtan.test",
    phone: "09123334455",
    password: "123456",
    role: "user",
    avatarUrl: "/images/athlete-2.jpg",
    bodyInfo: {
      gender: "male",
      age: 32,
      height: 182,
      weight: 88,
      activityLevel: "active",
    },
    equipment: "gym",
    goal: "build_muscle",
    onboardingCompleted: true,
    currentPlanId: "plan_reza_ai_1",
    subscriptionStatus: "basic",
    targetWeight: 92,
    createdAt: "2026-08-05T09:00:00.000Z",
    updatedAt: "2026-08-20T11:00:00.000Z",
  },
  {
    id: "coach_user_1",
    name: "مهدی احمدی",
    email: "mehdi.coach@sepandtan.test",
    phone: "09121112233",
    password: "123456",
    role: "coach",
    avatarUrl: "/images/athlete-1.jpg",
    onboardingCompleted: true,
    currentPlanId: null,

    subscriptionStatus: "free",
    createdAt: "2026-07-15T08:00:00.000Z",
    updatedAt: "2026-07-15T08:00:00.000Z",
  },
  {
    id: "coach_user_2",
    name: "نرگس کاظمی",
    email: "narges.coach@sepandtan.test",
    phone: "09124445566",
    password: "123456",
    role: "coach",
    avatarUrl: "/images/athlete-3.jpg",
    onboardingCompleted: true,
    currentPlanId: null,

    subscriptionStatus: "free",
    createdAt: "2026-07-20T09:00:00.000Z",
    updatedAt: "2026-07-20T09:00:00.000Z",
  },
  {
    id: "coach_user_3",
    name: "امیر حسینی",
    email: "amir.coach@sepandtan.test",
    phone: "09127778899",
    password: "123456",
    role: "coach",
    avatarUrl: "/images/athlete-4.jpg",
    onboardingCompleted: true,
    currentPlanId: null,

    subscriptionStatus: "free",
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
  },
];
