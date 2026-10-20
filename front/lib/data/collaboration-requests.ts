import type { CollaborationRequest } from "@/lib/types/coach";

/**
 * مسیر دمو:
 * 1) mehdi.coach@sepandtan.test
 * 2) /coach/requests → Accept درخواست سارا
 * 3) /coach/clients → سارا → اختصاص برنامه published
 * 4) sara@sepandtan.test → داشبورد برنامه مربی
 */
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
    acceptedAt: "2026-08-25T15:30:00.000Z",
    respondedAt: "2026-08-25T15:30:00.000Z",
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
    respondedAt: "2026-08-16T11:00:00.000Z",
    rejectionReason: "ظرفیت تکمیل است",
  },
  {
    id: "req_4",
    userId: "user_demo_2",
    coachId: "coach_1",
    goal: "general_fitness",
    message:
      "سلام، تازه شروع کردم. می‌خوام با مربی پیش برم تا برنامه اصولی داشته باشم.",
    status: "pending",
    createdAt: "2026-09-18T09:30:00.000Z",
  },
];
