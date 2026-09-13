import type { WeightLog } from "@/lib/types/plan";

/**
 * لاگ وزن برای داشبورد و چارت پیشرفت
 * علی: روند کاهشی | رضا: روند افزایشی (عضله‌سازی)
 */
export const weightLogs: WeightLog[] = [
  // علی — کاهش وزن
  {
    id: "w1",
    userId: "user_demo_1",
    weight: 82,
    date: "2026-08-01",
    note: "شروع برنامه AI",
  },
  {
    id: "w2",
    userId: "user_demo_1",
    weight: 81.4,
    date: "2026-08-05",
  },
  {
    id: "w3",
    userId: "user_demo_1",
    weight: 80.8,
    date: "2026-08-10",
  },
  {
    id: "w4",
    userId: "user_demo_1",
    weight: 80.2,
    date: "2026-08-14",
  },
  {
    id: "w5",
    userId: "user_demo_1",
    weight: 79.6,
    date: "2026-08-20",
  },
  {
    id: "w6",
    userId: "user_demo_1",
    weight: 79.1,
    date: "2026-08-26",
    note: "شروع برنامه مربی",
  },
  {
    id: "w7",
    userId: "user_demo_1",
    weight: 78.8,
    date: "2026-08-30",
  },

  // رضا — افزایش وزن عضلانی
  {
    id: "w8",
    userId: "user_demo_3",
    weight: 88,
    date: "2026-08-05",
    note: "شروع برنامه عضله‌سازی",
  },
  {
    id: "w9",
    userId: "user_demo_3",
    weight: 88.6,
    date: "2026-08-12",
  },
  {
    id: "w10",
    userId: "user_demo_3",
    weight: 89.2,
    date: "2026-08-20",
  },
  {
    id: "w11",
    userId: "user_demo_3",
    weight: 89.8,
    date: "2026-08-28",
  },
];
