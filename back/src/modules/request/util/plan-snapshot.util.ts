import { randomUUID } from 'node:crypto';
import { BadRequestException } from '@nestjs/common';

// ═════════ Date helpers (Asia/Tehran، بدون DST) ═════════

const TEHRAN_OFFSET_MS = 3.5 * 60 * 60 * 1000;
export const DAY_MS = 86_400_000;

/** امروز به وقت تهران، به‌صورت UTC midnight (مناسب ستون‌های @db.Date) */
export function tehranToday(now = Date.now()): Date {
  const d = new Date(now + TEHRAN_OFFSET_MS);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** لحظه‌ی شروع امروز تهران (instant واقعی UTC) — برای شمردن «درخواست‌های امروز» */
export function tehranDayStart(now = Date.now()): Date {
  return new Date(tehranToday(now).getTime() - TEHRAN_OFFSET_MS);
}

export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

/** YYYY-MM-DD → Date (UTC midnight) با اعتبارسنجی کامل */
export function parseDateOnly(input: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input ?? '');
  if (!m) throw new BadRequestException('تاریخ باید به فرمت YYYY-MM-DD باشد');
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) {
    throw new BadRequestException('تاریخ نامعتبر است');
  }
  return date;
}

/** ۰=شنبه … ۶=جمعه */
export function weekdayOf(date: Date): number {
  return (date.getUTCDay() + 1) % 7;
}

/**
 * هفته‌ی جاری برنامه (۱-based).
 * قبل از startDate → ۱؛ بعد از duration هم آخرین هفته را نگه می‌داریم مگر clamp=false.
 */
export function resolvePlanWeek(
  startDate: Date | null | undefined,
  today: Date,
  durationWeeks?: number | null,
): number {
  if (!startDate) return 1;
  const diff = Math.floor((today.getTime() - startDate.getTime()) / DAY_MS);
  if (diff < 0) return 1;
  const week = Math.floor(diff / 7) + 1;
  if (durationWeeks && durationWeeks > 0) return Math.min(week, durationWeeks);
  return Math.max(1, week);
}

// ═════════ Number helpers ═════════

export type Num = number | { toNumber(): number };
export const toNum = (v: Num): number => (typeof v === 'number' ? v : v.toNumber());
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Prisma JSON input را بدون درگیر شدن با تایپ‌های سخت‌گیرانه‌اش می‌پذیرد */
export const toJson = (v: unknown): any => v;

// ═════════ Snapshot types
// ساختار سبک: ۳ فاز (مثلاً ۱–۳ / ۴–۶ / ۷–۸) — days فقط یک‌بار در هر فاز ذخیره می‌شود.
// هرگز برای هر هفته‌ی جداگانه days را تکرار نکن؛ JSON سنگین می‌شود.

export type Macros = { calories: number; proteinG: number; carbsG: number; fatG: number };
export type Target = {
  calories: number | null;
  proteinG: number | null;
  carbsG: number | null;
  fatG: number | null;
};

export type WorkoutSnapshotExercise = {
  exerciseId: string;
  title: string;
  cover: string | null;
  order: number;
  sets: number | null;
  reps: string | null;
  durationSec: number | null;
  restSec: number | null;
  notes: string | null;
};
export type WorkoutSnapshotDay = {
  weekday: number;
  title: string | null;
  isRestDay: boolean;
  notes: string | null;
  exercises: WorkoutSnapshotExercise[];
};
export type WorkoutSnapshotPhase = {
  title: string;
  startWeek: number;
  endWeek: number;
  days: WorkoutSnapshotDay[];
};
export type WorkoutSnapshot = {
  v: 1;
  templateId: string | null;
  title: string;
  durationWeeks: number;
  phases: WorkoutSnapshotPhase[];
};

export type DietSnapshotItem = {
  foodId: string;
  name: string;
  grams: number;
  notes: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};
export type DietSnapshotMeal = {
  id: string;
  type: string;
  priority: string;
  order: number;
  notes: string | null;
  nutrition: Macros;
  items: DietSnapshotItem[];
};
export type DietSnapshotDay = {
  weekday: number;
  title: string | null;
  notes: string | null;
  target: Target;
  nutrition: Macros;
  meals: DietSnapshotMeal[];
};
export type DietSnapshotPhase = {
  title: string;
  startWeek: number;
  endWeek: number;
  days: DietSnapshotDay[];
};
export type DietSnapshot = {
  v: 1;
  templateId: string | null;
  title: string;
  durationWeeks: number;
  /** فقط وقتی غذایی بعداً به برنامه‌ی ورزشی فعال اضافه شود؛ در غیر این صورت null (= startDate خود UserPlan) */
  startDate: string | null;
  target: Target;
  phases: DietSnapshotPhase[];
};

export type PhaseOutline = {
  phaseNumber: number;
  title: string;
  startWeek: number;
  endWeek: number;
};

// ═════════ Input shapes ═════════

export interface WorkoutInput {
  phases: {
    title: string;
    startWeek: number;
    endWeek: number;
    days: {
      weekday: number;
      title?: string | null;
      isRestDay?: boolean;
      notes?: string | null;
      exercises: {
        exerciseId: string;
        order: number;
        sets?: number | null;
        reps?: string | null;
        durationSec?: number | null;
        restSec?: number | null;
        notes?: string | null;
      }[];
    }[];
  }[];
}

export interface DietTargetInput {
  targetCalories?: number | null;
  targetProteinG?: number | null;
  targetCarbsG?: number | null;
  targetFatG?: number | null;
}

export interface DietInput extends DietTargetInput {
  phases: (DietTargetInput & {
    title: string;
    startWeek: number;
    endWeek: number;
    days: {
      weekday: number;
      title?: string | null;
      notes?: string | null;
      meals: {
        id?: string;
        type: string;
        priority?: string;
        order: number;
        notes?: string | null;
        items: { foodId: string; quantityGrams: number; notes?: string | null }[];
      }[];
    }[];
  })[];
}

export type ExerciseLite = { title: string; cover: string | null };
export type FoodLite = {
  name: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
};

// ═════════ Validation ═════════

const MAX_WEEK = 105;
const MAX_ROWS = 2000;

function assertPhases(
  phases: { startWeek: number; endWeek: number; days: { weekday: number }[] }[],
) {
  if (!phases.length) throw new BadRequestException('حداقل یک فاز لازم است');

  const sorted = [...phases].sort((a, b) => a.startWeek - b.startWeek);
  let prevEnd = 0;
  for (const p of sorted) {
    if (p.startWeek < 1 || p.endWeek < p.startWeek || p.endWeek > MAX_WEEK) {
      throw new BadRequestException('بازه‌ی هفته‌ی یک فاز نامعتبر است');
    }
    if (p.startWeek <= prevEnd) {
      throw new BadRequestException('فازها نباید هم‌پوشانی داشته باشند');
    }
    prevEnd = p.endWeek;

    const seen = new Set<number>();
    for (const d of p.days) {
      if (!Number.isInteger(d.weekday) || d.weekday < 0 || d.weekday > 6) {
        throw new BadRequestException('weekday باید بین ۰ تا ۶ باشد');
      }
      if (seen.has(d.weekday)) {
        throw new BadRequestException('weekday تکراری در یک فاز');
      }
      seen.add(d.weekday);
    }
  }
}

// ═════════ Phase helpers (بدون کپی days) ═════════

export function phaseOutline(
  phases: { title: string; startWeek: number; endWeek: number }[],
): PhaseOutline[] {
  return [...phases]
    .sort((a, b) => a.startWeek - b.startWeek)
    .map((p, i) => ({
      phaseNumber: i + 1,
      title: p.title,
      startWeek: p.startWeek,
      endWeek: p.endWeek,
    }));
}

export function pickPhaseByWeek<T extends { startWeek: number; endWeek: number }>(
  phases: T[] | undefined,
  week: number,
): T | null {
  if (!phases?.length) return null;
  return phases.find((p) => week >= p.startWeek && week <= p.endWeek) ?? null;
}

/** phaseNumber یک‌پایه (۱ = اولین فاز مرتب‌شده بر اساس startWeek) */
export function pickPhaseByNumber<T extends { startWeek: number; endWeek: number }>(
  phases: T[] | undefined,
  phaseNumber: number,
): T | null {
  if (!phases?.length || phaseNumber < 1) return null;
  const sorted = [...phases].sort((a, b) => a.startWeek - b.startWeek);
  return sorted[phaseNumber - 1] ?? null;
}

export function phaseNumberOfWeek(
  phases: { startWeek: number; endWeek: number }[],
  week: number,
): number | null {
  const sorted = [...phases].sort((a, b) => a.startWeek - b.startWeek);
  const idx = sorted.findIndex((p) => week >= p.startWeek && week <= p.endWeek);
  return idx >= 0 ? idx + 1 : null;
}

// ═════════ Builders ═════════

export function collectExerciseIds(input: WorkoutInput): string[] {
  const ids = new Set<string>();
  for (const p of input.phases) {
    for (const d of p.days) for (const e of d.exercises) ids.add(e.exerciseId);
  }
  return [...ids];
}

export function collectFoodIds(input: DietInput): string[] {
  const ids = new Set<string>();
  for (const p of input.phases) {
    for (const d of p.days) for (const m of d.meals) for (const i of m.items) ids.add(i.foodId);
  }
  return [...ids];
}

export function buildWorkoutSnapshot(
  input: WorkoutInput,
  meta: { templateId: string | null; title: string },
  exercises: Map<string, ExerciseLite>,
): WorkoutSnapshot {
  assertPhases(input.phases);

  let rows = 0;
  const phases: WorkoutSnapshotPhase[] = [...input.phases]
    .sort((a, b) => a.startWeek - b.startWeek)
    .map((p) => ({
      title: p.title,
      startWeek: p.startWeek,
      endWeek: p.endWeek,
      days: [...p.days]
        .sort((a, b) => a.weekday - b.weekday)
        .map((d) => ({
          weekday: d.weekday,
          title: d.title ?? null,
          isRestDay: d.isRestDay ?? false,
          notes: d.notes ?? null,
          exercises: [...d.exercises]
            .sort((a, b) => a.order - b.order)
            .map((e, idx) => {
              const ex = exercises.get(e.exerciseId);
              if (!ex) throw new BadRequestException(`حرکت ${e.exerciseId} یافت نشد`);
              rows++;
              return {
                exerciseId: e.exerciseId,
                title: ex.title,
                cover: ex.cover,
                order: idx + 1,
                sets: e.sets ?? null,
                reps: e.reps ?? null,
                durationSec: e.durationSec ?? null,
                restSec: e.restSec ?? null,
                notes: e.notes ?? null,
              };
            }),
        })),
    }));

  if (rows === 0) throw new BadRequestException('برنامه‌ی ورزشی باید حداقل یک حرکت داشته باشد');
  if (rows > MAX_ROWS) throw new BadRequestException(`حداکثر ${MAX_ROWS} حرکت در یک برنامه مجاز است`);

  return {
    v: 1,
    templateId: meta.templateId,
    title: meta.title,
    durationWeeks: Math.max(...phases.map((p) => p.endWeek)),
    phases,
  };
}

function sumMacros(list: Macros[]): Macros {
  const t = list.reduce(
    (a, m) => ({
      calories: a.calories + m.calories,
      proteinG: a.proteinG + m.proteinG,
      carbsG: a.carbsG + m.carbsG,
      fatG: a.fatG + m.fatG,
    }),
    { calories: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
  return {
    calories: round1(t.calories),
    proteinG: round1(t.proteinG),
    carbsG: round1(t.carbsG),
    fatG: round1(t.fatG),
  };
}

const targetOf = (t: DietTargetInput): Target => ({
  calories: t.targetCalories ?? null,
  proteinG: t.targetProteinG ?? null,
  carbsG: t.targetCarbsG ?? null,
  fatG: t.targetFatG ?? null,
});

export function buildDietSnapshot(
  input: DietInput,
  meta: { templateId: string | null; title: string },
  foods: Map<string, FoodLite>,
): DietSnapshot {
  assertPhases(input.phases);

  const planTarget = targetOf(input);
  let rows = 0;

  const phases: DietSnapshotPhase[] = [...input.phases]
    .sort((a, b) => a.startWeek - b.startWeek)
    .map((p) => {
      const phaseTarget = targetOf(p);
      const target: Target = {
        calories: phaseTarget.calories ?? planTarget.calories,
        proteinG: phaseTarget.proteinG ?? planTarget.proteinG,
        carbsG: phaseTarget.carbsG ?? planTarget.carbsG,
        fatG: phaseTarget.fatG ?? planTarget.fatG,
      };

      return {
        title: p.title,
        startWeek: p.startWeek,
        endWeek: p.endWeek,
        days: [...p.days]
          .sort((a, b) => a.weekday - b.weekday)
          .map((d) => {
            const meals: DietSnapshotMeal[] = [...d.meals]
              .sort((a, b) => a.order - b.order)
              .map((m, mIdx) => {
                const items: DietSnapshotItem[] = m.items.map((i) => {
                  const f = foods.get(i.foodId);
                  if (!f) throw new BadRequestException(`غذا ${i.foodId} یافت نشد`);
                  rows++;
                  const k = i.quantityGrams / 100;
                  return {
                    foodId: i.foodId,
                    name: f.name,
                    grams: i.quantityGrams,
                    notes: i.notes ?? null,
                    calories: round1(f.caloriesPer100g * k),
                    proteinG: round1(f.proteinPer100g * k),
                    carbsG: round1(f.carbsPer100g * k),
                    fatG: round1(f.fatPer100g * k),
                  };
                });
                return {
                  id: m.id ?? randomUUID(),
                  type: m.type,
                  priority: m.priority ?? 'PRIMARY',
                  order: mIdx + 1,
                  notes: m.notes ?? null,
                  nutrition: sumMacros(
                    items.map((it) => ({
                      calories: it.calories,
                      proteinG: it.proteinG,
                      carbsG: it.carbsG,
                      fatG: it.fatG,
                    })),
                  ),
                  items,
                };
              });

            return {
              weekday: d.weekday,
              title: d.title ?? null,
              notes: d.notes ?? null,
              target,
              nutrition: sumMacros(meals.filter((m) => m.priority === 'PRIMARY').map((m) => m.nutrition)),
              meals,
            };
          }),
      };
    });

  if (rows === 0) throw new BadRequestException('برنامه‌ی غذایی باید حداقل یک آیتم غذایی داشته باشد');
  if (rows > MAX_ROWS * 2) throw new BadRequestException('تعداد آیتم‌های غذایی بیش از حد مجاز است');

  return {
    v: 1,
    templateId: meta.templateId,
    title: meta.title,
    durationWeeks: Math.max(...phases.map((p) => p.endWeek)),
    startDate: null,
    target: planTarget,
    phases,
  };
}
