/** Aligned with swagger UserLogEntity / CreateUserLogDto / UpdateUserLogDto */

export type ExtraExercise = {
  name: string;
  durationMin?: number | null;
  caloriesBurned?: number | null;
  note?: string | null;
};

export type ExtraMeal = {
  name: string;
  calories?: number | null;
  proteinG?: number | null;
  carbsG?: number | null;
  fatG?: number | null;
};

export type UserLog = {
  id: string;
  userId: string;
  userPlanId: string | null;
  /** YYYY-MM-DD (Tehran calendar day) */
  date: string;
  jalaliYear: number;
  jalaliMonth: number;
  weightKg: number | null;
  unCompletedExerciseIds: string[];
  plannedExercises: number;
  doneExercises: number;
  extraExercises: ExtraExercise[];
  caloriesBurned: number | null;
  unCompletedMealIds: string[];
  plannedMeals: number;
  doneMeals: number;
  extraMeals: ExtraMeal[];
  caloriesPlanned: number | null;
  caloriesConsumed: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
  userNote: string | null;
  coachNote: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserLogSummary = {
  id: string;
  date: string;
  weightKg: number | null;
  doneExercises: number;
  plannedExercises: number;
  doneMeals: number;
  plannedMeals: number;
  caloriesConsumed: number | null;
  userPlanId: string | null;
};

export type CreateUserLogInput = {
  date: string;
  userPlanId?: string;
  weightKg?: number;
  plannedExercises?: number;
  unCompletedExerciseIds?: string[];
  extraExercises?: ExtraExercise[];
  caloriesBurned?: number;
  plannedMeals?: number;
  unCompletedMealIds?: string[];
  extraMeals?: ExtraMeal[];
  caloriesPlanned?: number;
  caloriesConsumed?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  userNote?: string;
  /** schema typo in backend: startimetAt */
  startedAt?: string;
  endedAt?: string;
};

export type UpdateUserLogInput = Partial<
  Omit<CreateUserLogInput, "date" | "userPlanId">
> & {
  coachNote?: string;
};

export type LogStatsBucket = {
  planned: number;
  done: number;
};
