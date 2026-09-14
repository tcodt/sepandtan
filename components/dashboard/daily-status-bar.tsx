"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Flame, Dumbbell, Apple, CheckCircle2, Circle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserPlan } from "@/hooks/use-user-plan";
import type { NutritionLog, WorkoutLog } from "@/lib/types/plan";

type Props = {
  workouts?: WorkoutLog[];
  nutritions?: NutritionLog[];
};

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function calcStreak(workouts: WorkoutLog[]) {
  const daysWithWorkout = new Set(
    workouts
      .filter((w) => w.exercises?.some((e) => e.completed))
      .map((w) => w.date),
  );

  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 30; i++) {
    const key = d.toISOString().split("T")[0];
    if (daysWithWorkout.has(key)) {
      streak += 1;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export function DailyStatusBar({ workouts = [], nutritions = [] }: Props) {
  const { todayDay, currentDayNumber, hasPlan } = useUserPlan();
  const today = getToday();

  const workoutLog = useMemo(() => {
    const same = workouts.filter((w) => w.date === today);
    return same.length ? same[same.length - 1] : null;
  }, [workouts, today]);

  const nutritionLog = useMemo(() => {
    const same = nutritions.filter((n) => n.date === today);
    return same.length ? same[same.length - 1] : null;
  }, [nutritions, today]);

  const workoutTotal = todayDay?.exercises?.length || 0;
  const workoutDone =
    workoutLog?.exercises?.filter((e) => e.completed).length || 0;
  const workoutPct =
    workoutTotal > 0 ? Math.round((workoutDone / workoutTotal) * 100) : 0;
  const workoutComplete = workoutTotal > 0 && workoutDone >= workoutTotal;

  const mealTotal = todayDay?.meals?.length || 0;
  const mealDone =
    nutritionLog?.meals?.filter((m) => m.status === "eaten").length || 0;
  const mealPct = mealTotal > 0 ? Math.round((mealDone / mealTotal) * 100) : 0;

  const streak = calcStreak(workouts);
  const dayLabel = hasPlan ? `روز ${currentDayNumber}` : "بدون برنامه";

  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-foreground">
              وضعیت امروز · {dayLabel}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {todayDay?.title || "برنامه امروز هنوز آماده نیست"}
            </p>
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
            <Flame className="w-3.5 h-3.5" />
            {streak > 0
              ? `${streak.toLocaleString("fa-IR")} روز متوالی`
              : "شروع استریک"}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/workout/today"
            className="rounded-xl border border-border bg-background p-3 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Dumbbell className="w-4 h-4 text-primary" />
                تمرین
              </div>
              {workoutComplete ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <Progress value={workoutPct} className="h-2" />
            <p className="text-[11px] text-muted-foreground mt-2">
              {workoutDone.toLocaleString("fa-IR")} از{" "}
              {workoutTotal.toLocaleString("fa-IR")} حرکت
            </p>
          </Link>

          <Link
            href="/nutrition"
            className="rounded-xl border border-border bg-background p-3 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Apple className="w-4 h-4 text-primary" />
                رژیم
              </div>
              {mealTotal > 0 && mealDone >= mealTotal ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <Circle className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <Progress value={mealPct} className="h-2" />
            <p className="text-[11px] text-muted-foreground mt-2">
              {mealDone.toLocaleString("fa-IR")} از{" "}
              {mealTotal.toLocaleString("fa-IR")} وعده
            </p>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
