import { api } from "./client";
import type { WorkoutLog, NutritionLog, WeightLog } from "@/lib/types/plan";

// ─── Workout Logs ───────────────────────────────────────

export async function getWorkoutLogs(userId: string): Promise<WorkoutLog[]> {
  const all = await api.get<WorkoutLog[]>(`/workoutLogs`);
  return (all || []).filter((x) => x.userId === userId);
}

export async function getWorkoutLogByDate(
  userId: string,
  date: string,
): Promise<WorkoutLog | null> {
  const logs = await getWorkoutLogs(userId);
  const sameDay = logs.filter((x) => x.date === date);
  if (!sameDay.length) return null;

  // آخرین ثبت همان روز
  return sameDay[sameDay.length - 1] ?? null;
}

export async function saveWorkoutLog(
  log: Omit<WorkoutLog, "id">,
): Promise<WorkoutLog> {
  return api.post<WorkoutLog>("/workoutLogs", log);
}

export async function updateWorkoutLog(
  id: string,
  data: Partial<WorkoutLog>,
): Promise<WorkoutLog> {
  return api.patch<WorkoutLog>(`/workoutLogs/${id}`, data);
}

// ─── Nutrition Logs ─────────────────────────────────────

export async function getNutritionLogs(
  userId: string,
): Promise<NutritionLog[]> {
  const all = await api.get<NutritionLog[]>(`/nutritionLogs`);
  return (all || []).filter((x) => x.userId === userId);
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
  return api.post<NutritionLog>("/nutritionLogs", log);
}

export async function updateNutritionLog(
  id: string,
  data: Partial<NutritionLog>,
): Promise<NutritionLog> {
  return api.patch<NutritionLog>(`/nutritionLogs/${id}`, data);
}

// ─── Weight Logs ────────────────────────────────────────

export async function getWeightLogs(userId: string): Promise<WeightLog[]> {
  // برای سازگاری با json-server 0.17 و 1.x:
  // اول همه را بگیر، بعد فیلتر کن
  const all = await api.get<WeightLog[]>(`/weightLogs`);
  const filtered = (all || []).filter((x) => x.userId === userId);

  return filtered.sort((a, b) => a.date.localeCompare(b.date));
}

export async function addWeightLog(
  log: Omit<WeightLog, "id">,
): Promise<WeightLog> {
  // اطمینان از شکل داده
  const payload = {
    userId: log.userId,
    weight: Number(log.weight),
    date: log.date,
    note: log.note ?? "",
  };

  const saved = await api.post<WeightLog>("/weightLogs", payload);

  // اگر سرور id ندهد، باز هم همان داده را برگردان
  return saved;
}
