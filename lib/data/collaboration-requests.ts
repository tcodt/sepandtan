import type { CollaborationRequest } from "@/lib/types/coach";

export const collaborationRequests: CollaborationRequest[] = [
  {
    id: "req_1",
    userId: "user_demo_1",
    coachId: "coach_1",
    goal: "lose_weight",
    message:
      "سلام مربی، می‌خوام برنامه تخصصی کاهش وزن بگیرم. هدفم رسیدن به ۷۵ کیلو هست.",
    status: "accepted",
    createdAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "req_2",
    userId: "user_demo_3",
    coachId: "coach_3",
    goal: "build_muscle",
    message:
      "سلام، برنامه AI دارم ولی می‌خوام با مربی واقعی پیش برم برای عضله‌سازی حرفه‌ای‌تر.",
    status: "pending",
    createdAt: "2026-08-28T14:20:00.000Z",
  },
  {
    id: "req_3",
    userId: "user_demo_1",
    coachId: "coach_2",
    goal: "lose_weight",
    message: "درخواست تست برای مربی نرگس",
    status: "rejected",
    createdAt: "2026-08-15T09:00:00.000Z",
  },
];
