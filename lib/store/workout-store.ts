import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Exercise } from "@/lib/data/exercises";

export type WorkoutExercise = {
  id: string;
  name: string;
  muscle: string;
  sets: number;
  reps: string;
  restSeconds: number;
  completed: boolean;
  notes?: string;
  sourceExerciseId?: string; // لینک به کتابخانه
};

export type WorkoutSession = {
  id: string;
  date: string;
  exercises: WorkoutExercise[];
  startedAt: string | null;
  finishedAt: string | null;
  isActive: boolean;
};

type WorkoutState = {
  session: WorkoutSession | null;
  activeExerciseId: string | null;
  currentSetIndex: number;

  startSession: (exercises: WorkoutExercise[]) => void;
  setActiveExercise: (id: string | null) => void;
  completeSet: (exerciseId: string, setIndex: number) => void;
  completeExercise: (exerciseId: string) => void;
  finishSession: () => void;
  resetSession: () => void;

  /** اضافه کردن حرکت از کتابخانه به برنامه امروز */
  addExerciseFromLibrary: (exercise: Exercise) => {
    ok: boolean;
    message: string;
  };
  removeExercise: (workoutExerciseId: string) => void;
  isInTodayPlan: (libraryExerciseId: string) => boolean;
};

/** تبدیل حرکت کتابخانه به فرمت جلسه تمرین */
export function mapLibraryToWorkout(exercise: Exercise): WorkoutExercise {
  const primaryMuscle =
    exercise.primaryMuscles?.[0] != null
      ? exercise.primaryMuscles[0]
      : "full_body";

  const muscleMap: Record<string, string> = {
    chest: "سینه",
    back: "پشت",
    shoulders: "شانه",
    arms: "بازو",
    legs: "پا",
    glutes: "باسن",
    core: "میان‌تنه",
    full_body: "کل بدن",
  };

  return {
    id: crypto.randomUUID(),
    name: exercise.name,
    muscle: muscleMap[primaryMuscle] ?? primaryMuscle,
    sets: 3,
    reps: exercise.level === "beginner" ? "۱۲-۱۵" : "۱۰-۱۲",
    restSeconds: exercise.category === "cardio" ? 30 : 60,
    completed: false,
    sourceExerciseId: exercise.id,
  };
}

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set, get) => ({
      session: null,
      activeExerciseId: null,
      currentSetIndex: 0,

      startSession: (exercises) => {
        set({
          session: {
            id: crypto.randomUUID(),
            date: new Date().toISOString().split("T")[0],
            exercises,
            startedAt: new Date().toISOString(),
            finishedAt: null,
            isActive: true,
          },
          activeExerciseId: null,
          currentSetIndex: 0,
        });
      },

      setActiveExercise: (id) => {
        set({ activeExerciseId: id, currentSetIndex: 0 });
      },

      completeSet: (_exerciseId, setIndex) => {
        set({ currentSetIndex: setIndex + 1 });
      },

      completeExercise: (exerciseId) => {
        const { session } = get();
        if (!session) return;

        set({
          session: {
            ...session,
            exercises: session.exercises.map((ex) =>
              ex.id === exerciseId ? { ...ex, completed: true } : ex,
            ),
          },
          activeExerciseId: null,
          currentSetIndex: 0,
        });
      },

      finishSession: () => {
        const { session } = get();
        if (!session) return;

        set({
          session: {
            ...session,
            finishedAt: new Date().toISOString(),
            isActive: false,
          },
          activeExerciseId: null,
        });
      },

      resetSession: () => {
        set({
          session: null,
          activeExerciseId: null,
          currentSetIndex: 0,
        });
      },

      isInTodayPlan: (libraryExerciseId) => {
        const { session } = get();
        if (!session) return false;
        return session.exercises.some(
          (ex) => ex.sourceExerciseId === libraryExerciseId,
        );
      },

      addExerciseFromLibrary: (exercise) => {
        const { session, isInTodayPlan } = get();

        if (isInTodayPlan(exercise.id)) {
          return {
            ok: false,
            message: "این حرکت از قبل در برنامه امروز هست",
          };
        }

        const workoutEx = mapLibraryToWorkout(exercise);

        if (!session) {
          // اگر جلسه‌ای نبود، یک جلسه جدید بساز
          set({
            session: {
              id: crypto.randomUUID(),
              date: new Date().toISOString().split("T")[0],
              exercises: [workoutEx],
              startedAt: new Date().toISOString(),
              finishedAt: null,
              isActive: true,
            },
          });
          return { ok: true, message: "به برنامه امروز اضافه شد" };
        }

        set({
          session: {
            ...session,
            exercises: [...session.exercises, workoutEx],
            isActive: true,
            finishedAt: null,
          },
        });

        return { ok: true, message: "به برنامه امروز اضافه شد" };
      },

      removeExercise: (workoutExerciseId) => {
        const { session } = get();
        if (!session) return;

        set({
          session: {
            ...session,
            exercises: session.exercises.filter(
              (ex) => ex.id !== workoutExerciseId,
            ),
          },
        });
      },
    }),
    { name: "sepandtan-workout-session" },
  ),
);
