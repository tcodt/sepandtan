"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, Circle, Loader2, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useUserPlan } from "@/hooks/use-user-plan";
import {
  useWorkoutStore,
  type WorkoutExercise,
} from "@/lib/store/workout-store";
import {
  getWorkoutLogByDate,
  saveWorkoutLog,
  updateWorkoutLog,
} from "@/lib/api/logs";
import { WorkoutComplete } from "./workout-complete";
import { CompletionBottomSheet } from "./completion-bottom-sheet";
import { InlineState } from "@/components/common/states/inline-state";

function mapPlanExercisesToSession(
  exercises: {
    exerciseId: string;
    name: string;
    muscle: string;
    sets: number;
    reps: string;
    restSeconds: number;
  }[],
  completedMap?: Map<string, boolean>,
): WorkoutExercise[] {
  return exercises.map((ex) => ({
    id: crypto.randomUUID(),
    name: ex.name,
    muscle: ex.muscle,
    sets: ex.sets,
    reps: ex.reps,
    restSeconds: ex.restSeconds,
    completed: completedMap?.get(ex.exerciseId) ?? false,
    sourceExerciseId: ex.exerciseId,
  }));
}

export function TodayWorkout() {
  const { plan, todayDay, currentDayNumber, isLoading, hasPlan, error, user } =
    useUserPlan();

  const {
    session,
    startSession,
    completeExercise,
    finishSession,
    resetSession,
  } = useWorkoutStore();

  const [existingLogId, setExistingLogId] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);

  // جلوگیری از bootstrap تکراری
  const bootKeyRef = useRef<string>("");

  const basePlanExercises = useMemo(
    () => todayDay?.exercises ?? [],
    // فقط وقتی day یا plan عوض شد
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayDay?.dayNumber, plan?.id],
  );

  useEffect(() => {
    // تا وقتی plan در حال لود است صبر کن
    if (isLoading) return;

    // اگر plan یا روز وجود ندارد → bootstrap را تمام‌شده در نظر بگیر تا به Empty/Error برسیم
    if (!user?.id || !todayDay) {
      setBootstrapped(true);
      return;
    }

    // Rest Day یا بدون حرکت → نیازی به session نیست
    if (todayDay.isRestDay || basePlanExercises.length === 0) {
      setBootstrapped(true);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const bootKey = `${user.id}-${plan?.id}-${todayDay.dayNumber}-${today}`;

    // اگر قبلاً برای همین روز bootstrap شده، دوباره اجرا نکن
    if (bootKeyRef.current === bootKey && bootstrapped) return;

    let cancelled = false;

    async function bootstrap() {
      const completedMap = new Map<string, boolean>();

      try {
        const log = await getWorkoutLogByDate(user!.id, today);
        if (log) {
          setExistingLogId(log.id);
          log.exercises?.forEach(
            (ex: { exerciseId: string; completed?: boolean }) => {
              completedMap.set(ex.exerciseId, !!ex.completed);
            },
          );
        } else {
          setExistingLogId(null);
        }
      } catch {
        // json-server ممکن است بالا نباشد — با session محلی ادامه بده
      }

      if (cancelled) return;

      const seeded = mapPlanExercisesToSession(basePlanExercises, completedMap);

      // فقط وقتی session مربوط به امروز نیست یا خالی است، از نو بساز
      if (
        !session ||
        session.date !== today ||
        session.exercises.length === 0
      ) {
        startSession(seeded);
      }

      bootKeyRef.current = bootKey;
      setBootstrapped(true);
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
    // عمداً session و startSession/resetSession را dependency نکردیم تا loop نشود
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isLoading,
    user?.id,
    plan?.id,
    todayDay?.dayNumber,
    todayDay?.isRestDay,
    basePlanExercises.length,
  ]);

  // ---------- Loading ----------
  if (isLoading || !bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2
          className="w-8 h-8 animate-spin text-primary"
          aria-label="در حال بارگذاری"
        />
      </div>
    );
  }

  // ---------- Error / Empty ----------
  if (error || !hasPlan || !todayDay) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-6">
          <InlineState
            type={error ? "error" : "empty-workout"}
            onRetry={error ? () => window.location.reload() : undefined}
          />
        </div>
      </div>
    );
  }

  // ---------- Rest Day ----------
  if (todayDay.isRestDay) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-6">
          <InlineState type="rest-day" />
        </div>
      </div>
    );
  }

  // ---------- Content ----------
  const exercises = session?.exercises ?? [];
  const completedCount = exercises.filter((e) => e.completed).length;
  const total = exercises.length;
  const progress = total > 0 ? (completedCount / total) * 100 : 0;
  const allDone = total > 0 && completedCount === total;

  const durationMinutes = todayDay.estimatedMinutes || 0;
  const estimatedCalories = exercises.reduce((sum, ex) => sum + ex.sets * 5, 0);

  const handleFinishClick = () => {
    setCompletionOpen(true);
  };

  const handleCompletionSubmit = async (data: {
    difficulty?: number;
    note?: string;
  }) => {
    if (!user?.id || !plan?.id) {
      toast.error("کاربر یا برنامه پیدا نشد");
      return;
    }

    const payload = {
      userId: user.id,
      planId: plan.id,
      dayNumber: currentDayNumber,
      date: new Date().toISOString().split("T")[0],
      exercises: exercises.map((ex) => ({
        exerciseId: ex.sourceExerciseId || ex.id,
        completed: !!ex.completed,
        completedSets: ex.completed ? ex.sets : 0,
      })),
      durationMinutes,
      completedAt: new Date().toISOString(),
      difficulty: data.difficulty,
      note: data.note,
    };

    try {
      if (existingLogId) {
        await updateWorkoutLog(existingLogId, payload);
      } else {
        const saved = await saveWorkoutLog(payload);
        setExistingLogId(saved.id);
      }

      finishSession();
      toast.success("تمرین ثبت شد");
      setShowComplete(true);
      setCompletionOpen(false);
    } catch (e) {
      console.error(e);
      toast.error("ثبت تمرین ناموفق بود. json-server را چک کن (npm run api).");
    }
  };

  const handleReset = () => {
    resetSession();
    startSession(mapPlanExercisesToSession(basePlanExercises));
    setExistingLogId(null);
    toast.message("تمرین از نو شروع شد");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">تمرین امروز</h1>
            <p className="text-sm text-muted-foreground mt-1">
              روز {currentDayNumber} — {todayDay.title}
              {todayDay.focus ? ` · ${todayDay.focus}` : ""}
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">داشبورد</Link>
          </Button>
        </div>

        <Card className="border-border bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {completedCount.toLocaleString("fa-IR")} از{" "}
              {total.toLocaleString("fa-IR")} حرکت
            </CardTitle>
            <Progress value={progress} className="h-2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-2">
            {exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                حرکتی برای امروز تعریف نشده.
              </p>
            ) : (
              exercises.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => {
                    if (!ex.completed) completeExercise(ex.id);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-colors",
                    ex.completed
                      ? "border-primary/30 bg-primary/5"
                      : "border-border bg-background hover:bg-muted/30",
                  )}
                >
                  {ex.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        ex.completed ? "text-primary" : "text-foreground",
                      )}
                    >
                      {ex.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ex.sets} × {ex.reps} · {ex.muscle} · استراحت{" "}
                      {ex.restSeconds}ث
                    </p>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {allDone ? (
            <Button className="flex-1 h-11 gap-2" onClick={handleFinishClick}>
              <CheckCircle2 className="w-4 h-4" />
              ثبت و اتمام تمرین
            </Button>
          ) : (
            <Button className="flex-1 h-11 gap-2" disabled>
              <Play className="w-4 h-4" />
              حرکات را تیک بزن
            </Button>
          )}
          <Button
            variant="outline"
            className="h-11 px-3"
            onClick={handleReset}
            aria-label="شروع مجدد"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <CompletionBottomSheet
        open={completionOpen}
        onOpenChange={setCompletionOpen}
        durationMinutes={durationMinutes}
        estimatedCalories={estimatedCalories}
        onComplete={handleCompletionSubmit}
      />

      {showComplete && (
        <WorkoutComplete
          completedCount={completedCount}
          totalCount={total}
          durationMinutes={durationMinutes}
          dayNumber={currentDayNumber}
          onClose={() => setShowComplete(false)}
        />
      )}
    </div>
  );
}
