"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Apple, ChevronLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useUserPlan } from "@/hooks/use-user-plan";
import { getNutritionLogByDate } from "@/lib/api/logs";
import type { NutritionLog } from "@/lib/types/plan";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/common/empty-state";

const MEAL_LABELS: Record<string, string> = {
  breakfast: "صبحانه",
  snack: "میان‌وعده",
  lunch: "ناهار",
  dinner: "شام",
};

export function NutritionSummary() {
  const { user, todayDay, isLoading, hasPlan } = useUserPlan();
  const [todayLog, setTodayLog] = useState<NutritionLog | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const today = new Date().toISOString().split("T")[0];
    getNutritionLogByDate(user.id, today)
      .then((log) => setTodayLog(log))
      .catch(() => setTodayLog(null));
  }, [user?.id, todayDay?.dayNumber]);

  const statusMap = useMemo(() => {
    const map = new Map<string, string>();
    todayLog?.meals?.forEach((m) => map.set(m.mealId, m.status));
    return map;
  }, [todayLog]);

  if (isLoading) {
    return (
      <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!hasPlan || !todayDay) {
    return (
      <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
        <CardContent>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <EmptyState
              icon={<Apple className="w-5 h-5" />}
              title="رژیمی برای امروز نیست"
              description="بعد از ساخت برنامه، وعده‌های روزانه اینجا می‌آیند."
              actionLabel="ساخت برنامه"
              actionHref="/onboarding"
              className="py-6"
            />
          </motion.div>
        </CardContent>
      </Card>
    );
  }

  const meals = todayDay.meals;
  const target = todayDay.dailyCaloriesTarget;

  const eatenMeals = meals.filter((m) => statusMap.get(m.id) === "eaten");
  const consumed = eatenMeals.reduce((sum, m) => sum + m.calories, 0);
  const progress = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;

  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Apple className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">تغذیه امروز</CardTitle>
            <p className="text-xs text-muted-foreground">
              {consumed.toLocaleString("fa-IR")} از{" "}
              {target.toLocaleString("fa-IR")} کالری ·{" "}
              {eatenMeals.length.toLocaleString("fa-IR")} از{" "}
              {meals.length.toLocaleString("fa-IR")} وعده
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <Progress value={progress} className="h-2" />

        <div className="space-y-2">
          {meals.map((meal) => {
            const status = statusMap.get(meal.id) || "pending";
            const eaten = status === "eaten";
            const skipped = status === "skipped";

            return (
              <div
                key={meal.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span
                  className={cn(
                    eaten && "text-muted-foreground line-through",
                    skipped && "opacity-60",
                    !eaten && !skipped && "text-foreground",
                  )}
                >
                  {MEAL_LABELS[meal.type] || meal.type}
                  {eaten ? " ✓" : skipped ? " —" : ""}
                </span>
                <span className="text-muted-foreground tabular-nums shrink-0">
                  {meal.calories.toLocaleString("fa-IR")} کالری
                </span>
              </div>
            );
          })}
        </div>

        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full mt-1 gap-1"
        >
          <Link href="/nutrition">
            مشاهده و ثبت رژیم
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
