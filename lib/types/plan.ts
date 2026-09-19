/** انواع مشترک برنامه تمرینی و رژیمی — منبع حقیقت برای User Flow + Coach Flow */

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

/** مدل اشتراک قفل‌شده */
export type SubscriptionStatus =
  | "free"
  | "basic"
  | "pro"
  | "premium"
  | "coach_plan";

export type BodyInfo = {
  gender: Gender;
  age: number;
  height: number;
  weight: number;
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
  currentPlanId?: string | null;
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
  /** برای برنامه مربی اختیاری است */
  calories?: number;
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
  /** برای برنامه مربی اختیاری است */
  dailyCaloriesTarget?: number;
};

/** وضعیت‌های برنامه */
export type PlanStatus =
  | "draft"
  | "published"
  | "assigned"
  | "active"
  | "archived";

/** نوع الگوی برنامه */
export type PlanPatternType = "full" | "weekly";

export type Plan = {
  id: string;
  /** null تا زمان Assign/Activate برای برنامه مربی */
  userId: string | null;
  goal: Goal;
  equipment: Equipment;
  level: "beginner" | "intermediate" | "advanced";
  title: string;
  description: string;
  /** null تا زمان Activate */
  startDate: string | null;
  durationDays: number;
  days: PlanDay[];
  createdAt: string;
  source: "ai" | "coach";
  coachId?: string | null;

  // ——— فیلدهای جدید Coach Flow ———
  status: PlanStatus;
  patternType?: PlanPatternType; // پیش‌فرض منطقی برای AI = "full"
  weeklyTemplate?: PlanDay[]; // دقیقاً ۷ روز — فقط برای weekly
  durationWeeks?: 4 | 6 | 8;
  clientRelationId?: string | null;
  publishedAt?: string | null;
  assignedAt?: string | null;
  activatedAt?: string | null;
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

export type CoachProfile = {
  id: string;
  userId: string;
  name: string;
  bio: string;
  specialties: string[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  pricePerPlan: number;
  pricePerConsultation: number;
  avatarUrl?: string;
  verified: boolean;
  isActive: boolean;
  samplePlans?: string[];
  createdAt: string;
  /** نمایش کمیسیون در MVP (۲۰–۲۵٪) */
  commissionRateDisplay?: string;
  documentsStatus?: "none" | "pending" | "approved" | "rejected";
};

/** پلن‌های اشتراک قابل فروش */
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
  // فیلدهای اختیاری قدیمی که ممکن است جایی استفاده شده باشند
  status?: SubscriptionStatus;
  durationDays?: number;
  isPopular?: boolean;
  description?: string;
  createdAt?: string;
};
