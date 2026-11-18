import { apiClient } from "@/lib/api/client";
import { asArray, asNumber, asString } from "@/features/catalog/utils";
import type {
  CreateUserLogInput,
  ExtraExercise,
  ExtraMeal,
  LogStatsBucket,
  UpdateUserLogInput,
  UserLog,
  UserLogSummary,
} from "./types";

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return asNumber(value);
}

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return asString(value);
}

function normalizeDate(value: unknown): string {
  const s = asString(value);
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return s;
}

function mapExtraExercise(raw: unknown): ExtraExercise | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const name = asString(r.name);
  if (!name) return null;
  return {
    name,
    durationMin: asNullableNumber(r.durationMin),
    caloriesBurned: asNullableNumber(r.caloriesBurned),
    note: asNullableString(r.note),
  };
}

function mapExtraMeal(raw: unknown): ExtraMeal | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const name = asString(r.name);
  if (!name) return null;
  return {
    name,
    calories: asNullableNumber(r.calories),
    proteinG: asNullableNumber(r.proteinG),
    carbsG: asNullableNumber(r.carbsG),
    fatG: asNullableNumber(r.fatG),
  };
}

function stringIdList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((x) => asString(x)).filter((x): x is string => Boolean(x));
}

export function mapUserLog(raw: unknown): UserLog | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const userId = asString(r.userId);
  const date = normalizeDate(r.date);
  if (!id || !userId || !date) return null;

  const extraExercises = (
    Array.isArray(r.extraExercises) ? r.extraExercises : []
  )
    .map(mapExtraExercise)
    .filter((x): x is ExtraExercise => x !== null);

  const extraMeals = (Array.isArray(r.extraMeals) ? r.extraMeals : [])
    .map(mapExtraMeal)
    .filter((x): x is ExtraMeal => x !== null);

  return {
    id,
    userId,
    userPlanId: asNullableString(r.userPlanId),
    date,
    jalaliYear: asNumber(r.jalaliYear) ?? 0,
    jalaliMonth: asNumber(r.jalaliMonth) ?? 0,
    weightKg: asNullableNumber(r.weightKg),
    unCompletedExerciseIds: stringIdList(r.unCompletedExerciseIds),
    plannedExercises: asNumber(r.plannedExercises) ?? 0,
    doneExercises: asNumber(r.doneExercises) ?? 0,
    extraExercises,
    caloriesBurned: asNullableNumber(r.caloriesBurned),
    unCompletedMealIds: stringIdList(r.unCompletedMealIds),
    plannedMeals: asNumber(r.plannedMeals) ?? 0,
    doneMeals: asNumber(r.doneMeals) ?? 0,
    extraMeals,
    caloriesPlanned: asNullableNumber(r.caloriesPlanned),
    caloriesConsumed: asNullableNumber(r.caloriesConsumed),
    proteinG: asNullableNumber(r.proteinG),
    carbsG: asNullableNumber(r.carbsG),
    fatG: asNullableNumber(r.fatG),
    userNote: asNullableString(r.userNote),
    coachNote: asNullableString(r.coachNote),
    // backend schema typos
    startedAt: asNullableString(r.startimetAt) ?? asNullableString(r.startedAt),
    endedAt: asNullableString(r.endtimeAt) ?? asNullableString(r.endedAt),
    createdAt: asString(r.createdAt) ?? "",
    updatedAt: asString(r.updatedAt) ?? "",
  };
}

function mapUserLogSummary(raw: unknown): UserLogSummary | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const date = normalizeDate(r.date);
  if (!id || !date) return null;
  return {
    id,
    date,
    weightKg: asNullableNumber(r.weightKg),
    doneExercises: asNumber(r.doneExercises) ?? 0,
    plannedExercises: asNumber(r.plannedExercises) ?? 0,
    doneMeals: asNumber(r.doneMeals) ?? 0,
    plannedMeals: asNumber(r.plannedMeals) ?? 0,
    caloriesConsumed: asNullableNumber(r.caloriesConsumed),
    userPlanId: asNullableString(r.userPlanId),
  };
}

function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const root = (data ?? {}) as Record<string, unknown>;
  for (const key of ["logs", "data", "items", "results"]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }
  return asArray(data);
}

function toCreateBody(input: CreateUserLogInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    date: input.date,
  };
  if (input.userPlanId !== undefined) body.userPlanId = input.userPlanId;
  if (input.weightKg !== undefined) body.weightKg = input.weightKg;
  if (input.plannedExercises !== undefined)
    body.plannedExercises = input.plannedExercises;
  if (input.unCompletedExerciseIds !== undefined)
    body.unCompletedExerciseIds = input.unCompletedExerciseIds;
  if (input.extraExercises !== undefined)
    body.extraExercises = input.extraExercises;
  if (input.caloriesBurned !== undefined)
    body.caloriesBurned = input.caloriesBurned;
  if (input.plannedMeals !== undefined) body.plannedMeals = input.plannedMeals;
  if (input.unCompletedMealIds !== undefined)
    body.unCompletedMealIds = input.unCompletedMealIds;
  if (input.extraMeals !== undefined) body.extraMeals = input.extraMeals;
  if (input.caloriesPlanned !== undefined)
    body.caloriesPlanned = input.caloriesPlanned;
  if (input.caloriesConsumed !== undefined)
    body.caloriesConsumed = input.caloriesConsumed;
  if (input.proteinG !== undefined) body.proteinG = input.proteinG;
  if (input.carbsG !== undefined) body.carbsG = input.carbsG;
  if (input.fatG !== undefined) body.fatG = input.fatG;
  if (input.userNote !== undefined) body.userNote = input.userNote;
  // schema field names from swagger
  if (input.startedAt !== undefined) body.startimetAt = input.startedAt;
  if (input.endedAt !== undefined) body.endtimeAt = input.endedAt;
  return body;
}

/** POST /log */
export async function createUserLog(
  input: CreateUserLogInput,
): Promise<UserLog> {
  const { data } = await apiClient.post("/log", toCreateBody(input));
  const mapped = mapUserLog(data);
  if (!mapped) throw new Error("پاسخ ثبت لاگ نامعتبر است");
  return mapped;
}

/** GET /log — my logs */
export async function fetchMyLogs(params?: {
  page?: number;
  limit?: number;
}): Promise<UserLog[]> {
  const { data } = await apiClient.get("/log", { params });
  return extractList(data)
    .map(mapUserLog)
    .filter((l): l is UserLog => l !== null);
}

/** GET /log/date/{date} */
export async function fetchLogByDate(date: string): Promise<UserLog | null> {
  try {
    const { data } = await apiClient.get(
      `/log/date/${encodeURIComponent(date)}`,
    );
    if (!data) return null;
    return mapUserLog(data);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return null;
    }
    throw error;
  }
}

/** GET /log/id/{logId} */
export async function fetchLogById(logId: string): Promise<UserLog> {
  const { data } = await apiClient.get(`/log/id/${encodeURIComponent(logId)}`);
  const mapped = mapUserLog(data);
  if (!mapped) throw new Error("لاگ پیدا نشد");
  return mapped;
}

/** GET /log/dashboard */
export async function fetchDashboardLogs(): Promise<UserLogSummary[]> {
  const { data } = await apiClient.get("/log/dashboard");
  return extractList(data)
    .map(mapUserLogSummary)
    .filter((l): l is UserLogSummary => l !== null);
}

/** GET /log/plan/{planId} */
export async function fetchLogsByPlan(planId: string): Promise<UserLog[]> {
  const { data } = await apiClient.get(
    `/log/plan/${encodeURIComponent(planId)}`,
  );
  return extractList(data)
    .map(mapUserLog)
    .filter((l): l is UserLog => l !== null);
}

/** PUT /log/{id} */
export async function updateUserLog(
  id: string,
  input: UpdateUserLogInput,
): Promise<UserLog> {
  const body: Record<string, unknown> = {};
  if (input.weightKg !== undefined) body.weightKg = input.weightKg;
  if (input.plannedExercises !== undefined)
    body.plannedExercises = input.plannedExercises;
  if (input.unCompletedExerciseIds !== undefined)
    body.unCompletedExerciseIds = input.unCompletedExerciseIds;
  if (input.extraExercises !== undefined)
    body.extraExercises = input.extraExercises;
  if (input.caloriesBurned !== undefined)
    body.caloriesBurned = input.caloriesBurned;
  if (input.plannedMeals !== undefined) body.plannedMeals = input.plannedMeals;
  if (input.unCompletedMealIds !== undefined)
    body.unCompletedMealIds = input.unCompletedMealIds;
  if (input.extraMeals !== undefined) body.extraMeals = input.extraMeals;
  if (input.caloriesPlanned !== undefined)
    body.caloriesPlanned = input.caloriesPlanned;
  if (input.caloriesConsumed !== undefined)
    body.caloriesConsumed = input.caloriesConsumed;
  if (input.proteinG !== undefined) body.proteinG = input.proteinG;
  if (input.carbsG !== undefined) body.carbsG = input.carbsG;
  if (input.fatG !== undefined) body.fatG = input.fatG;
  if (input.userNote !== undefined) body.userNote = input.userNote;
  if (input.coachNote !== undefined) body.coachNote = input.coachNote;
  if (input.startedAt !== undefined) body.startimetAt = input.startedAt;
  if (input.endedAt !== undefined) body.endtimeAt = input.endedAt;

  const { data } = await apiClient.put(`/log/${encodeURIComponent(id)}`, body);
  const mapped = mapUserLog(data);
  if (!mapped) throw new Error("پاسخ ویرایش لاگ نامعتبر است");
  return mapped;
}

/** DELETE /log/{id} */
export async function deleteUserLog(id: string): Promise<void> {
  await apiClient.delete(`/log/${encodeURIComponent(id)}`);
}

/** GET /log/stats/weekly */
export async function fetchWeeklyStats(params?: {
  from?: string;
  to?: string;
}): Promise<LogStatsBucket> {
  const { data } = await apiClient.get("/log/stats/weekly", { params });
  const r = (data ?? {}) as Record<string, unknown>;
  return {
    planned: asNumber(r.planned) ?? 0,
    done: asNumber(r.done) ?? 0,
  };
}

/** GET /log/stats/monthly */
export async function fetchMonthlyStats(params?: {
  year?: number;
}): Promise<LogStatsBucket> {
  const { data } = await apiClient.get("/log/stats/monthly", { params });
  const r = (data ?? {}) as Record<string, unknown>;
  return {
    planned: asNumber(r.planned) ?? 0,
    done: asNumber(r.done) ?? 0,
  };
}

/** GET /log/stats/yearly */
export async function fetchYearlyStats(params?: {
  year?: number;
}): Promise<LogStatsBucket> {
  const { data } = await apiClient.get("/log/stats/yearly", { params });
  const r = (data ?? {}) as Record<string, unknown>;
  return {
    planned: asNumber(r.planned) ?? 0,
    done: asNumber(r.done) ?? 0,
  };
}

/** PATCH /log/{id}/coach-note */
export async function patchCoachNote(
  id: string,
  coachNote: string,
): Promise<UserLog> {
  const { data } = await apiClient.patch(
    `/log/${encodeURIComponent(id)}/coach-note`,
    { coachNote },
  );
  const mapped = mapUserLog(data);
  if (!mapped) throw new Error("پاسخ یادداشت مربی نامعتبر است");
  return mapped;
}
