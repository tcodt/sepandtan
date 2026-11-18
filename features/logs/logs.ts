/**
 * Compatibility layer over real /log API.
 *
 * Backend model = unified UserLog (weight + exercise + meal in one row).
 * Old UI expects separate WorkoutLog / NutritionLog / WeightLog.
 *
 * REMOVE when these use features/logs hooks directly:
 * - hooks/use-dashboard-logs.ts
 * - hooks/use-seed-start-weight.ts
 * - components/dashboard/*
 * - components/workout/today-workout.tsx
 * - components/nutrition/today-nutrition.tsx
 * - components/onboarding/onboarding-wizard.tsx (addWeightLog)
 */
import type { NutritionLog, WeightLog, WorkoutLog } from "@/lib/types/plan";
import {
  createUserLog,
  fetchLogByDate,
  fetchMyLogs,
  updateUserLog,
} from "@/features/logs/api";
import type { UserLog } from "@/features/logs/types";

function toWeightLog(log: UserLog): WeightLog | null {
  if (log.weightKg == null) return null;
  return {
    id: log.id,
    userId: log.userId,
    weight: log.weightKg,
    date: log.date,
    note: log.userNote ?? undefined,
  };
}

function toWorkoutLog(log: UserLog): WorkoutLog {
  const exercises: WorkoutLog["exercises"] = [];
  const done = log.doneExercises;
  const planned = log.plannedExercises;

  for (let i = 0; i < planned; i++) {
    const exerciseId =
      log.unCompletedExerciseIds[i] ?? `placeholder-${log.id}-${i}`;
    const completed =
      i < done && !log.unCompletedExerciseIds.includes(exerciseId);
    exercises.push({
      exerciseId,
      completed: completed || i < done,
      completedSets: completed || i < done ? 1 : 0,
    });
  }

  for (const id of log.unCompletedExerciseIds) {
    const existing = exercises.find((e) => e.exerciseId === id);
    if (existing) {
      existing.completed = false;
      existing.completedSets = 0;
    } else {
      exercises.push({
        exerciseId: id,
        completed: false,
        completedSets: 0,
      });
    }
  }

  return {
    id: log.id,
    userId: log.userId,
    planId: log.userPlanId ?? "",
    dayNumber: 0,
    date: log.date,
    exercises,
    durationMinutes: undefined,
    completedAt: log.endedAt ?? undefined,
  };
}

function toNutritionLog(log: UserLog): NutritionLog {
  const meals: NutritionLog["meals"] = [];
  const planned = log.plannedMeals;
  const done = log.doneMeals;

  for (let i = 0; i < planned; i++) {
    const mealId =
      log.unCompletedMealIds[i] ?? `placeholder-meal-${log.id}-${i}`;
    const skipped = log.unCompletedMealIds.includes(mealId);
    meals.push({
      mealId,
      status: skipped ? "skipped" : i < done ? "eaten" : "pending",
    });
  }

  for (const id of log.unCompletedMealIds) {
    if (!meals.some((m) => m.mealId === id)) {
      meals.push({ mealId: id, status: "skipped" });
    }
  }

  return {
    id: log.id,
    userId: log.userId,
    planId: log.userPlanId ?? "",
    date: log.date,
    meals,
  };
}

// ─── Workout Logs ───────────────────────────────────────

export async function getWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
  void userId;
  const logs = await fetchMyLogs();
  return logs
    .filter((l) => l.plannedExercises > 0 || l.doneExercises > 0)
    .map(toWorkoutLog);
}

export async function getWorkoutLogByDate(
  userId: string,
  date: string,
): Promise<WorkoutLog | null> {
  void userId;
  const log = await fetchLogByDate(date);
  if (!log) return null;
  if (log.plannedExercises === 0 && log.doneExercises === 0) return null;
  return toWorkoutLog(log);
}

export async function saveWorkoutLog(
  log: Omit<WorkoutLog, "id">,
): Promise<WorkoutLog> {
  const unCompleted = log.exercises
    .filter((e) => !e.completed)
    .map((e) => e.exerciseId);
  const planned = log.exercises.length;

  const existing = await fetchLogByDate(log.date);
  if (existing) {
    const updated = await updateUserLog(existing.id, {
      plannedExercises: planned,
      unCompletedExerciseIds: unCompleted,
    });
    return toWorkoutLog(updated);
  }

  const created = await createUserLog({
    date: log.date,
    userPlanId: log.planId || undefined,
    plannedExercises: planned,
    unCompletedExerciseIds: unCompleted,
  });
  return toWorkoutLog(created);
}

export async function updateWorkoutLog(
  id: string,
  data: Partial<WorkoutLog>,
): Promise<WorkoutLog> {
  const exercises = data.exercises;
  const unCompleted = exercises
    ? exercises.filter((e) => !e.completed).map((e) => e.exerciseId)
    : undefined;
  const planned = exercises ? exercises.length : undefined;

  const updated = await updateUserLog(id, {
    plannedExercises: planned,
    unCompletedExerciseIds: unCompleted,
  });
  return toWorkoutLog(updated);
}

// ─── Nutrition Logs ─────────────────────────────────────

export async function getNutritionLogs(
  userId: string,
): Promise<NutritionLog[]> {
  void userId;
  const logs = await fetchMyLogs();
  return logs
    .filter((l) => l.plannedMeals > 0 || l.doneMeals > 0)
    .map(toNutritionLog);
}

export async function getNutritionLogByDate(
  userId: string,
  date: string,
): Promise<NutritionLog | null> {
  void userId;
  const log = await fetchLogByDate(date);
  if (!log) return null;
  if (log.plannedMeals === 0 && log.doneMeals === 0) return null;
  return toNutritionLog(log);
}

export async function saveNutritionLog(
  log: Omit<NutritionLog, "id">,
): Promise<NutritionLog> {
  const unCompleted = log.meals
    .filter((m) => m.status === "skipped" || m.status === "pending")
    .map((m) => m.mealId);
  const planned = log.meals.length;

  const existing = await fetchLogByDate(log.date);
  if (existing) {
    const updated = await updateUserLog(existing.id, {
      plannedMeals: planned,
      unCompletedMealIds: unCompleted,
    });
    return toNutritionLog(updated);
  }

  const created = await createUserLog({
    date: log.date,
    userPlanId: log.planId || undefined,
    plannedMeals: planned,
    unCompletedMealIds: unCompleted,
  });
  return toNutritionLog(created);
}

export async function updateNutritionLog(
  id: string,
  data: Partial<NutritionLog>,
): Promise<NutritionLog> {
  const meals = data.meals;
  const unCompleted = meals
    ? meals
        .filter((m) => m.status === "skipped" || m.status === "pending")
        .map((m) => m.mealId)
    : undefined;
  const planned = meals ? meals.length : undefined;

  const updated = await updateUserLog(id, {
    plannedMeals: planned,
    unCompletedMealIds: unCompleted,
  });
  return toNutritionLog(updated);
}

// ─── Weight Logs ────────────────────────────────────────

export async function getWeightLogs(userId: string): Promise<WeightLog[]> {
  void userId;
  const logs = await fetchMyLogs();
  return logs
    .map(toWeightLog)
    .filter((l): l is WeightLog => l !== null)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function addWeightLog(
  log: Omit<WeightLog, "id">,
): Promise<WeightLog> {
  const existing = await fetchLogByDate(log.date);
  if (existing) {
    const updated = await updateUserLog(existing.id, {
      weightKg: Number(log.weight),
      userNote: log.note,
    });
    const projected = toWeightLog(updated);
    if (!projected) throw new Error("وزن ثبت نشد");
    return projected;
  }

  const created = await createUserLog({
    date: log.date,
    weightKg: Number(log.weight),
    userNote: log.note,
  });
  const projected = toWeightLog(created);
  if (!projected) throw new Error("وزن ثبت نشد");
  return projected;
}
