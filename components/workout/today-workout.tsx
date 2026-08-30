"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Loader2,
  Play,
  RotateCcw,
  ArrowLeft,
  Dumbbell,
  Flame,
  Clock,
  TrendingUp,
  Zap,
} from "lucide-react";
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

  const bootKeyRef = useRef<string>("");

  const basePlanExercises = useMemo(
    () => todayDay?.exercises ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [todayDay?.dayNumber, plan?.id],
  );

  useEffect(() => {
    if (isLoading) return;

    if (!user?.id || !todayDay) {
      setBootstrapped(true);
      return;
    }

    if (todayDay.isRestDay || basePlanExercises.length === 0) {
      setBootstrapped(true);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const bootKey = `${user.id}-${plan?.id}-${todayDay.dayNumber}-${today}`;

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
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="w-8 h-8 animate-spin text-primary"
            aria-label="در حال بارگذاری"
          />
          <p className="text-sm text-muted-foreground">
            بارگذاری تمرین امروز...
          </p>
        </div>
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

  // Get muscle group color
  const getMuscleColor = (muscle: string) => {
    const colors: Record<string, string> = {
      chest: "bg-red-500/10 text-red-500",
      back: "bg-blue-500/10 text-blue-500",
      legs: "bg-green-500/10 text-green-500",
      shoulders: "bg-purple-500/10 text-purple-500",
      arms: "bg-orange-500/10 text-orange-500",
      core: "bg-yellow-500/10 text-yellow-500",
      full: "bg-indigo-500/10 text-indigo-500",
    };
    return colors[muscle.toLowerCase()] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex items-start gap-2 sm:gap-3">
            <Link
              href="/dashboard"
              className="p-2 -mr-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 mt-0.5"
              aria-label="بازگشت"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
                <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <span>تمرین امروز</span>
                <span className="text-sm font-normal text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-full">
                  روز {currentDayNumber}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                {todayDay.title}
                {todayDay.focus ? ` · ${todayDay.focus}` : ""}
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="sm:mt-1">
            <Link href="/dashboard">داشبورد</Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <Card className="border-border/50 bg-linear-to-br from-primary/5 to-transparent">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  پیشرفت
                </p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground mt-1">
                {Math.round(progress)}%
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-linear-to-br from-emerald-500/5 to-transparent">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  انجام شده
                </p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground mt-1">
                {completedCount}/{total}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-linear-to-br from-blue-500/5 to-transparent">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  زمان
                </p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground mt-1">
                {durationMinutes} دقیقه
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-linear-to-br from-orange-500/5 to-transparent">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  کالری
                </p>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground mt-1">
                ~{estimatedCalories}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Exercises List */}
        <Card className="border-border/50 bg-muted/30 backdrop-blur-sm">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base flex items-center justify-between">
              <span>حرکات تمرینی</span>
              <span className="text-xs font-normal text-muted-foreground">
                {completedCount} از {total} انجام شده
              </span>
            </CardTitle>
            <Progress value={progress} className="h-2 sm:h-2.5" />
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-2.5">
            {exercises.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
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
                    "w-full flex items-center gap-3 p-3 sm:p-4 rounded-xl border text-right transition-all duration-200",
                    "hover:shadow-sm",
                    ex.completed
                      ? "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10"
                      : "border-border/50 bg-background hover:bg-muted/30 hover:border-primary/20",
                  )}
                >
                  <div className="shrink-0">
                    {ex.completed ? (
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
                    ) : (
                      <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p
                        className={cn(
                          "text-sm sm:text-base font-medium",
                          ex.completed
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-foreground",
                        )}
                      >
                        {ex.name}
                      </p>
                      <span
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full font-medium",
                          getMuscleColor(ex.muscle),
                        )}
                      >
                        {ex.muscle}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs sm:text-sm text-muted-foreground mt-0.5">
                      <span>{ex.sets} ست</span>
                      <span>·</span>
                      <span>{ex.reps} تکرار</span>
                      <span>·</span>
                      <span>استراحت {ex.restSeconds}ث</span>
                    </div>
                  </div>
                  {ex.completed && (
                    <span className="text-[10px] text-emerald-500 font-medium shrink-0">
                      ✓ انجام شد
                    </span>
                  )}
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          {allDone ? (
            <Button
              className="flex-1 h-11 sm:h-12 text-base font-semibold gap-2 shadow-lg shadow-primary/20"
              onClick={handleFinishClick}
            >
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              ثبت و اتمام تمرین
            </Button>
          ) : (
            <Button
              className="flex-1 h-11 sm:h-12 text-base font-semibold gap-2 opacity-60 cursor-not-allowed"
              disabled
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5" />
              {completedCount > 0
                ? `${completedCount} حرکت انجام شده`
                : "حرکات را تیک بزن"}
            </Button>
          )}
          <Button
            variant="outline"
            className="h-11 sm:h-12 px-4 sm:px-6 gap-2"
            onClick={handleReset}
            aria-label="شروع مجدد"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">شروع مجدد</span>
          </Button>
        </div>

        {/* Progress Hint */}
        {!allDone && completedCount > 0 && (
          <p className="text-xs text-center text-muted-foreground">
            {completedCount} از {total} حرکت انجام شده — برای تکمیل همه حرکات
            روی هر کدام کلیک کن
          </p>
        )}
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
