"use client";

import { useEffect, useMemo, useState } from "react";
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

  // فقط وقتی plan/day عوض شد، پایه را از plan بساز
  const basePlanExercises = useMemo(
    () => todayDay?.exercises ?? [],
    [todayDay?.dayNumber, plan?.id], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // bootstrap: log امروز را بخوان و session را با تیک‌های ذخیره‌شده بساز
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      if (!todayDay || !user?.id || basePlanExercises.length === 0) return;

      const today = new Date().toISOString().split("T")[0];
      const completedMap = new Map<string, boolean>();

      try {
        const log = await getWorkoutLogByDate(user.id, today);
        if (log) {
          setExistingLogId(log.id);
          log.exercises?.forEach((ex) => {
            completedMap.set(ex.exerciseId, !!ex.completed);
          });
        } else {
          setExistingLogId(null);
        }
      } catch {
        // API نبود؛ با session محلی ادامه بده
      }

      if (cancelled) return;

      const seeded = mapPlanExercisesToSession(basePlanExercises, completedMap);

      // اگر session امروز نیست یا خالی است، از نو بساز
      if (
        !session ||
        session.date !== today ||
        session.exercises.length === 0
      ) {
        startSession(seeded);
      } else {
        // session امروز هست: تیک‌های log را روی آن اعمال کن
        const merged = session.exercises.map((ex) => {
          const key = ex.sourceExerciseId || ex.id;
          if (completedMap.has(key)) {
            return { ...ex, completed: !!completedMap.get(key) };
          }
          return ex;
        });

        // اگر چیزی از plan کم است، اضافه کن
        const existingKeys = new Set(
          merged.map((x) => x.sourceExerciseId || x.id),
        );
        seeded.forEach((s) => {
          const key = s.sourceExerciseId || s.id;
          if (!existingKeys.has(key)) merged.push(s);
        });

        resetSession();
        startSession(merged);
      }

      setBootstrapped(true);
    }

    setBootstrapped(false);
    bootstrap();

    return () => {
      cancelled = true;
    };
    // فقط وقتی کاربر/روز/plan آماده شد
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, todayDay?.dayNumber, plan?.id, basePlanExercises.length]);

  if (isLoading || !bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !hasPlan || !todayDay) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-sm text-muted-foreground text-center">
          {error || "برنامه‌ای برای امروز پیدا نشد."}
        </p>
        <Button asChild variant="outline">
          <Link href="/dashboard">بازگشت به داشبورد</Link>
        </Button>
      </div>
    );
  }

  const exercises = session?.exercises ?? [];
  const completedCount = exercises.filter((e) => e.completed).length;
  const total = exercises.length;
  const progress = total > 0 ? (completedCount / total) * 100 : 0;
  const allDone = total > 0 && completedCount === total;

  const handleFinish = async () => {
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
        // مهم: همیشه id حرکت plan، نه uuid جلسه
        exerciseId: ex.sourceExerciseId || ex.id,
        completed: !!ex.completed,
        completedSets: ex.completed ? ex.sets : 0,
      })),
      durationMinutes: todayDay.estimatedMinutes,
      completedAt: new Date().toISOString(),
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
    } catch (e) {
      console.error(e);
      toast.error("ثبت تمرین ناموفق بود. json-server را چک کن.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {todayDay.isRestDay ? "روز ریکاوری" : "تمرین امروز"}
            </h1>
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
              {completedCount} از {total} حرکت
            </CardTitle>
            <Progress value={progress} className="h-2 mt-2" />
          </CardHeader>
          <CardContent className="space-y-2">
            {exercises.map((ex) => (
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
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {allDone ? (
            <Button className="flex-1 h-11 gap-2" onClick={handleFinish}>
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
            onClick={() => {
              resetSession();
              startSession(mapPlanExercisesToSession(basePlanExercises));
              setExistingLogId(null);
            }}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* نمایش مودال اتمام تمرین - اصلاح شده */}
      {showComplete && (
        <WorkoutComplete
          completedCount={completedCount}
          totalCount={total}
          durationMinutes={todayDay.estimatedMinutes}
          dayNumber={currentDayNumber}
          onClose={() => setShowComplete(false)}
        />
      )}
    </div>
  );
}
