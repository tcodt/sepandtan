import type { WorkoutLog, NutritionLog, WeightLog } from "@/lib/types/plan";
import { db } from "./db";
import { createId, delay } from "./client";

// ─── Workout Logs ───────────────────────────────────────

export async function getWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
  await delay();
  return db.workoutLogs
    .filter((x) => x.userId === userId)
    .map((l) => ({
      ...l,
      exercises: l.exercises.map((e) => ({ ...e })),
    }));
}

export async function getWorkoutLogByDate(
  userId: string,
  date: string,
): Promise<WorkoutLog | null> {
  const logs = await getWorkoutLogs(userId);
  const sameDay = logs.filter((x) => x.date === date);
  if (!sameDay.length) return null;
  return sameDay[sameDay.length - 1] ?? null;
}

export async function saveWorkoutLog(
  log: Omit<WorkoutLog, "id">,
): Promise<WorkoutLog> {
  await delay();
  const saved: WorkoutLog = {
    ...log,
    id: createId("wl"),
    exercises: log.exercises.map((e) => ({ ...e })),
  };
  db.workoutLogs.push(saved);
  return structuredClone(saved);
}

export async function updateWorkoutLog(
  id: string,
  data: Partial<WorkoutLog>,
): Promise<WorkoutLog> {
  await delay();
  const index = db.workoutLogs.findIndex((l) => l.id === id);
  if (index === -1) throw new Error(`لاگ تمرین پیدا نشد: ${id}`);

  const updated: WorkoutLog = {
    ...db.workoutLogs[index],
    ...data,
    id,
    exercises: (data.exercises ?? db.workoutLogs[index].exercises).map((e) => ({
      ...e,
    })),
  };
  db.workoutLogs[index] = updated;
  return structuredClone(updated);
}

// ─── Nutrition Logs ─────────────────────────────────────

export async function getNutritionLogs(
  userId: string,
): Promise<NutritionLog[]> {
  await delay();
  return db.nutritionLogs
    .filter((x) => x.userId === userId)
    .map((l) => ({
      ...l,
      meals: l.meals.map((m) => ({ ...m })),
    }));
}

export async function getNutritionLogByDate(
  userId: string,
  date: string,
): Promise<NutritionLog | null> {
  const logs = await getNutritionLogs(userId);
  const sameDay = logs.filter((x) => x.date === date);
  if (!sameDay.length) return null;
  return sameDay[sameDay.length - 1] ?? null;
}

export async function saveNutritionLog(
  log: Omit<NutritionLog, "id">,
): Promise<NutritionLog> {
  await delay();
  const saved: NutritionLog = {
    ...log,
    id: createId("nl"),
    meals: log.meals.map((m) => ({ ...m })),
  };
  db.nutritionLogs.push(saved);
  return structuredClone(saved);
}

export async function updateNutritionLog(
  id: string,
  data: Partial<NutritionLog>,
): Promise<NutritionLog> {
  await delay();
  const index = db.nutritionLogs.findIndex((l) => l.id === id);
  if (index === -1) throw new Error(`لاگ تغذیه پیدا نشد: ${id}`);

  const updated: NutritionLog = {
    ...db.nutritionLogs[index],
    ...data,
    id,
    meals: (data.meals ?? db.nutritionLogs[index].meals).map((m) => ({
      ...m,
    })),
  };
  db.nutritionLogs[index] = updated;
  return structuredClone(updated);
}

// ─── Weight Logs ────────────────────────────────────────

export async function getWeightLogs(userId: string): Promise<WeightLog[]> {
  await delay();
  return db.weightLogs
    .filter((x) => x.userId === userId)
    .map((l) => ({ ...l }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function addWeightLog(
  log: Omit<WeightLog, "id">,
): Promise<WeightLog> {
  await delay();
  const saved: WeightLog = {
    id: createId("w"),
    userId: log.userId,
    weight: Number(log.weight),
    date: log.date,
    note: log.note,
  };
  db.weightLogs.push(saved);
  return { ...saved };
}
