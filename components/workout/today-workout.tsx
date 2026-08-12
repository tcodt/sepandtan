"use client";

import { useEffect } from "react";
import {
  useWorkoutStore,
  type WorkoutExercise,
} from "@/lib/store/workout-store";
import { TodayHeader } from "./today-header";
import { SessionExerciseCard } from "./session-exercise-card";
import { ActiveExercise } from "./active-exercise";
import { WorkoutComplete } from "./workout-complete";
import { Button } from "@/components/ui/button";
import { Flame } from "lucide-react";

// ==================== MOCK DATA ====================
// بعداً از API یا برنامه ساخته‌شده توسط AI بگیر
const mockTodayExercises: WorkoutExercise[] = [
  {
    id: "1",
    name: "اسکوات با وزن بدن",
    muscle: "پا و باسن",
    sets: 3,
    reps: "۱۲-۱۵",
    restSeconds: 60,
    completed: false,
  },
  {
    id: "2",
    name: "شنا سوئدی",
    muscle: "سینه و دست",
    sets: 3,
    reps: "۱۰-۱۲",
    restSeconds: 60,
    completed: false,
  },
  {
    id: "3",
    name: "ددلیفت رومانیایی با دمبل",
    muscle: "پشت پا و کمر",
    sets: 3,
    reps: "۱۰",
    restSeconds: 90,
    completed: false,
  },
  {
    id: "4",
    name: "پلانک",
    muscle: "میان‌تنه",
    sets: 3,
    reps: "۴۰ ثانیه",
    restSeconds: 45,
    completed: false,
  },
  {
    id: "5",
    name: "لانگز معکوس",
    muscle: "پا",
    sets: 3,
    reps: "۱۰ هر پا",
    restSeconds: 60,
    completed: false,
  },
];
// ==================================================

export function TodayWorkout() {
  const {
    session,
    activeExerciseId,
    currentSetIndex,
    startSession,
    setActiveExercise,
    completeSet,
    completeExercise,
    finishSession,
    resetSession,
  } = useWorkoutStore();

  // شروع جلسه اگر وجود نداشت
  useEffect(() => {
    if (!session) {
      startSession(mockTodayExercises);
    }
  }, [session, startSession]);

  if (!session) return null;

  const exercises = session.exercises;
  const completedCount = exercises.filter((e) => e.completed).length;
  const allDone = completedCount === exercises.length && exercises.length > 0;
  const activeExercise = exercises.find((e) => e.id === activeExerciseId);

  // اگر همه تموم شده
  if (allDone && !session.isActive) {
    return (
      <WorkoutComplete
        completedCount={completedCount}
        onReset={() => {
          resetSession();
          startSession(
            mockTodayExercises.map((e) => ({ ...e, completed: false })),
          );
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <TodayHeader
          completedCount={completedCount}
          totalCount={exercises.length}
        />

        {/* لیست حرکات */}
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <SessionExerciseCard
              key={index}
              exercise={exercise}
              index={index}
              isActive={activeExerciseId === exercise.id}
              onStart={() => setActiveExercise(exercise.id)}
            />
          ))}
        </div>

        {/* دکمه اتمام کل تمرین */}
        {completedCount > 0 && completedCount === exercises.length && (
          <Button
            className="w-full h-12 text-base gap-2"
            onClick={finishSession}
          >
            <Flame className="w-4 h-4" />
            ثبت و اتمام تمرین
          </Button>
        )}
      </div>

      {/* حالت اجرای حرکت */}
      {activeExercise && (
        <ActiveExercise
          exercise={activeExercise}
          currentSetIndex={currentSetIndex}
          onCompleteSet={(setIndex) => completeSet(activeExercise.id, setIndex)}
          onCompleteExercise={() => completeExercise(activeExercise.id)}
          onClose={() => setActiveExercise(null)}
        />
      )}
    </div>
  );
}
