/** تایپ های مشترک برنامه تمرینی، رژیم، کاربر و اشتراک */

export type Gender = "male" | "female";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type Equipment = "home" | "gym" | "both";

export type Goal =
  | "lose_weight"
  | "build_muscle"
  | "maintain"
  | "endurance"
  | "general_fitness";

export type UserRole = "user" | "coach" | "admin";

/**
 * سطح اشتراک کاربر (جدا از برنامه تمرینی)
 * free     → بدون اشتراک پولی
 * basic    → اشتراک پایه
 * pro      → اشتراک حرفه‌ای
 * premium  → اشتراک کامل
 * coach_plan → برنامه اختصاصی مربی (سطح اشتراک جداگانه)
 */
export type SubscriptionStatus =
  | "free"
  | "basic"
  | "pro"
  | "premium"
  | "coach_plan";

export type BodyInfo = {
  gender: Gender;
  age: number;
  height: number; // cm
  weight: number; // kg
  activityLevel: ActivityLevel;
};

export type UserProfile = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  avatarUrl?: string;
  role: UserRole;
  bodyInfo?: BodyInfo;
  equipment?: Equipment;
  goal?: Goal;
  onboardingCompleted: boolean;

  /**
   * Source of Truth برای برنامه تمرینی فعال.
   * فقط یک plan با status="active" باید به این id اشاره کند.
   */
  currentPlanId?: string | null;

  /**
   * فقط برای اشتراک خریداری‌شده (draft/انتخاب‌شده در checkout).
   * مستقل از training plan است.
   */
  selectedPlanId?: string | null;

  subscriptionStatus: SubscriptionStatus;
  targetWeight?: number;
  createdAt: string;
  updatedAt?: string;
};

export type PlanExercise = {
  exerciseId: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
};

export type PlanMeal = {
  id: string;
  type: "breakfast" | "snack" | "lunch" | "dinner";
  title: string;
  description: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export type PlanDay = {
  dayNumber: number;
  title: string;
  focus: string;
  isRestDay: boolean;
  estimatedMinutes: number;
  exercises: PlanExercise[];
  meals: PlanMeal[];
  dailyCaloriesTarget: number;
};

/**
 * برنامه تمرینی + رژیمی
 * در هر لحظه فقط یک برنامه با status="active" برای هر کاربر مجاز است.
 */
export type Plan = {
  id: string;
  userId: string;
  goal: Goal;
  equipment: Equipment;
  level: "beginner" | "intermediate" | "advanced";
  title: string;
  description: string;
  startDate: string;
  durationDays: number;
  days: PlanDay[];
  createdAt: string;

  /** منبع ساخت برنامه */
  source: "ai" | "coach";

  /** وضعیت برنامه — فقط یکی active باشد */
  status: "active" | "archived";

  coachId?: string | null;
};

export type WorkoutLog = {
  id: string;
  userId: string;
  planId: string;
  dayNumber: number;
  date: string;
  exercises: {
    exerciseId: string;
    completed: boolean;
    completedSets: number;
    notes?: string;
  }[];
  durationMinutes?: number;
  completedAt?: string;
};

export type NutritionLog = {
  id: string;
  userId: string;
  planId: string;
  date: string;
  meals: {
    mealId: string;
    status: "pending" | "eaten" | "skipped" | "replaced";
    replacedWith?: string;
  }[];
};

export type WeightLog = {
  id: string;
  userId: string;
  weight: number;
  date: string;
  note?: string;
};

export type SubscriptionPlan = {
  id: string;
  name: string;
  price: number;
  periodLabel: string;
  featured: boolean;
  badge?: string | null;
  ctaLabel: string;
  sortOrder: number;
  isActive: boolean;
  features: string[];
};
