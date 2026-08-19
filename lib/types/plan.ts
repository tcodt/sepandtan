/** انواع مشترک برنامه تمرینی و رژیمی */

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

export type SubscriptionStatus = "free" | "ai_plan" | "coach_plan" | "vip";

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
  source: "ai" | "coach";
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
};
