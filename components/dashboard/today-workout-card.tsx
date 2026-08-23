"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Play, Circle, CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useUserPlan } from "@/hooks/use-user-plan";
import { getWorkoutLogByDate } from "@/lib/api/logs";
import type { WorkoutLog } from "@/lib/types/plan";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/common/empty-state";
import { Dumbbell } from "lucide-react";

export function TodayWorkoutCard() {
  const { user, todayDay, currentDayNumber, isLoading, hasPlan, error } =
    useUserPlan();
  const [todayLog, setTodayLog] = useState<WorkoutLog | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const today = new Date().toISOString().split("T")[0];

    const load = () => {
      getWorkoutLogByDate(user.id, today)
        .then((log) => setTodayLog(log))
        .catch(() => setTodayLog(null));
    };

    load();

    // وقتی کاربر از صفحه تمرین برمی‌گردد
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") load();
    });

    return () => {
      window.removeEventListener("focus", onFocus);
    };
  }, [user?.id, todayDay?.dayNumber]);

  const completedMap = useMemo(() => {
    const map = new Map<string, boolean>();
    todayLog?.exercises?.forEach((ex) => {
      map.set(String(ex.exerciseId), !!ex.completed);
    });
    return map;
  }, [todayLog]);

  if (isLoading) {
    return (
      <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || !hasPlan || !todayDay) {
    return (
      <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <EmptyState
              icon={<Dumbbell className="w-5 h-5" />}
              title="برنامه امروز آماده نیست"
              description={
                error
                  ? "خطا در بارگذاری برنامه. اتصال یا json-server را چک کن."
                  : "اول یک برنامه شخصی بساز تا تمرین روزانه فعال شود."
              }
              actionLabel="ساخت برنامه"
              actionHref="/onboarding"
              className="py-8"
            />
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  const exercises = todayDay.exercises;
  const completedCount = exercises.filter((item) =>
    completedMap.get(item.exerciseId),
  ).length;
  const total = exercises.length;
  const progress = total > 0 ? (completedCount / total) * 100 : 0;
  const allDone = total > 0 && completedCount === total;

  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base sm:text-lg">
            {todayDay.isRestDay ? "روز ریکاوری" : "برنامه امروز"}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            روز {currentDayNumber} — {todayDay.title}
            {todayDay.focus ? ` · ${todayDay.focus}` : ""}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {completedCount.toLocaleString("fa-IR")} از{" "}
            {total.toLocaleString("fa-IR")} حرکت انجام شده
          </p>
        </div>

        <Button asChild size="sm" className="gap-1.5 shrink-0">
          <Link href="/workout/today">
            <Play className="w-3.5 h-3.5" />
            {allDone ? "مشاهده" : "ادامه تمرین"}
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />

        <div className="space-y-2">
          {exercises.map((item) => {
            const done = !!completedMap.get(item.exerciseId);
            return (
              <div
                key={`${item.exerciseId}-${item.name}`}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border",
                  done
                    ? "border-primary/30 bg-primary/5"
                    : "border-border bg-background",
                )}
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      done ? "text-primary" : "text-foreground",
                    )}
                  >
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.sets} × {item.reps}
                    {item.muscle ? ` · ${item.muscle}` : ""}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <Button asChild variant="outline" className="w-full gap-2">
          <Link href="/workout/today">
            {allDone ? "مرور تمرین امروز" : "شروع / ادامه تمرین"}
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
