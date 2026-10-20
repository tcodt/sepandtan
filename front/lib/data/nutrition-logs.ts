import type { NutritionLog } from "@/lib/types/plan";

/**
 * لاگ وعده‌های غذایی
 * mealIdها با idهای داخل days برنامه‌ها هم‌خوان هستند
 */
export const nutritionLogs: NutritionLog[] = [
  // علی — برنامه AI آرشیو
  {
    id: "nl_1",
    userId: "user_demo_1",
    planId: "plan_ali_ai_1",
    date: "2026-08-01",
    meals: [
      { mealId: "ali_ai_d1m1", status: "eaten" },
      { mealId: "ali_ai_d1m2", status: "eaten" },
      { mealId: "ali_ai_d1m3", status: "skipped" },
    ],
  },
  {
    id: "nl_2",
    userId: "user_demo_1",
    planId: "plan_ali_ai_1",
    date: "2026-08-02",
    meals: [
      { mealId: "ali_ai_d2m1", status: "eaten" },
      { mealId: "ali_ai_d2m2", status: "eaten" },
    ],
  },

  // علی — برنامه فعال مربی
  {
    id: "nl_3",
    userId: "user_demo_1",
    planId: "plan_ali_coach_1",
    date: "2026-08-26",
    meals: [
      { mealId: "ali_c_d1m1", status: "eaten" },
      { mealId: "ali_c_d1m2", status: "eaten" },
      { mealId: "ali_c_d1m3", status: "eaten" },
    ],
  },
  {
    id: "nl_4",
    userId: "user_demo_1",
    planId: "plan_ali_coach_1",
    date: "2026-08-27",
    meals: [
      { mealId: "ali_c_d2m1", status: "eaten" },
      {
        mealId: "ali_c_d2m2",
        status: "replaced",
        replacedWith: "سالاد تن ماهی خانگی",
      },
    ],
  },

  // رضا — برنامه AI فعال
  {
    id: "nl_5",
    userId: "user_demo_3",
    planId: "plan_reza_ai_1",
    date: "2026-08-10",
    meals: [
      { mealId: "reza_d1m1", status: "eaten" },
      { mealId: "reza_d1m2", status: "eaten" },
      { mealId: "reza_d1m3", status: "eaten" },
    ],
  },
  {
    id: "nl_6",
    userId: "user_demo_3",
    planId: "plan_reza_ai_1",
    date: "2026-08-11",
    meals: [
      { mealId: "reza_d2m1", status: "eaten" },
      { mealId: "reza_d2m2", status: "skipped" },
    ],
  },
];
