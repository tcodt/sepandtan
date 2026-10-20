import type { WorkoutLog } from "@/lib/types/plan";

/**
 * لاگ تمرین‌های تکمیل‌شده
 * متصل به userId و planId موجود در lib/data
 */
export const workoutLogs: WorkoutLog[] = [
  // علی — روی برنامه AI آرشیو
  {
    id: "wl_1",
    userId: "user_demo_1",
    planId: "plan_ali_ai_1",
    dayNumber: 1,
    date: "2026-08-01",
    exercises: [
      { exerciseId: "2", completed: true, completedSets: 4 },
      { exerciseId: "9", completed: true, completedSets: 3 },
      { exerciseId: "3", completed: true, completedSets: 3 },
    ],
    durationMinutes: 42,
    completedAt: "2026-08-01T18:30:00.000Z",
  },
  {
    id: "wl_2",
    userId: "user_demo_1",
    planId: "plan_ali_ai_1",
    dayNumber: 2,
    date: "2026-08-02",
    exercises: [
      { exerciseId: "5", completed: true, completedSets: 4 },
      { exerciseId: "6", completed: true, completedSets: 3 },
    ],
    durationMinutes: 48,
    completedAt: "2026-08-02T19:10:00.000Z",
  },

  // علی — روی برنامه فعال مربی
  {
    id: "wl_3",
    userId: "user_demo_1",
    planId: "plan_ali_coach_1",
    dayNumber: 1,
    date: "2026-08-26",
    exercises: [
      { exerciseId: "2", completed: true, completedSets: 4 },
      { exerciseId: "9", completed: true, completedSets: 3 },
      { exerciseId: "8", completed: true, completedSets: 3 },
      { exerciseId: "12", completed: true, completedSets: 2 },
    ],
    durationMinutes: 52,
    completedAt: "2026-08-26T18:45:00.000Z",
  },
  {
    id: "wl_4",
    userId: "user_demo_1",
    planId: "plan_ali_coach_1",
    dayNumber: 2,
    date: "2026-08-27",
    exercises: [
      { exerciseId: "5", completed: true, completedSets: 4 },
      { exerciseId: "6", completed: true, completedSets: 3 },
      { exerciseId: "3", completed: true, completedSets: 3 },
    ],
    durationMinutes: 47,
    completedAt: "2026-08-27T19:00:00.000Z",
  },

  // رضا — روی برنامه AI فعال
  {
    id: "wl_5",
    userId: "user_demo_3",
    planId: "plan_reza_ai_1",
    dayNumber: 1,
    date: "2026-08-10",
    exercises: [
      { exerciseId: "20", completed: true, completedSets: 4 },
      { exerciseId: "21", completed: true, completedSets: 3 },
      { exerciseId: "22", completed: true, completedSets: 3 },
    ],
    durationMinutes: 58,
    completedAt: "2026-08-10T20:15:00.000Z",
  },
  {
    id: "wl_6",
    userId: "user_demo_3",
    planId: "plan_reza_ai_1",
    dayNumber: 2,
    date: "2026-08-11",
    exercises: [
      { exerciseId: "23", completed: true, completedSets: 3 },
      { exerciseId: "24", completed: true, completedSets: 3 },
      { exerciseId: "25", completed: false, completedSets: 1 },
    ],
    durationMinutes: 45,
    completedAt: "2026-08-11T19:40:00.000Z",
  },
];
