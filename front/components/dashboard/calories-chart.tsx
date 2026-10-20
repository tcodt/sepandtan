"use client";

import { useEffect, useMemo, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import "@/lib/chart-setup";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartData, ChartOptions } from "chart.js";
import { useUserPlan } from "@/hooks/use-user-plan";
import { getNutritionLogByDate } from "@/lib/api/logs";
import type { NutritionLog } from "@/lib/types/plan";
import { Loader2 } from "lucide-react";

export function CaloriesChart() {
  const { user, todayDay, isLoading: planLoading, hasPlan } = useUserPlan();
  const [todayLog, setTodayLog] = useState<NutritionLog | null>(null);
  const [logLoading, setLogLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTodayLog(null);
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    let cancelled = false;
    setLogLoading(true);

    getNutritionLogByDate(user.id, today)
      .then((log) => {
        if (!cancelled) setTodayLog(log);
      })
      .catch(() => {
        if (!cancelled) setTodayLog(null);
      })
      .finally(() => {
        if (!cancelled) setLogLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, todayDay?.dayNumber]);

  const { consumed, remaining, target, hasData } = useMemo(() => {
    if (!todayDay) {
      return { consumed: 0, remaining: 0, target: 0, hasData: false };
    }

    const targetCalories = todayDay.dailyCaloriesTarget || 0;
    const statusMap = new Map<string, string>();
    todayLog?.meals?.forEach((m) => statusMap.set(m.mealId, m.status));

    const eaten = todayDay.meals
      .filter((m) => statusMap.get(m.id) === "eaten")
      .reduce((sum, m) => sum + (m.calories || 0), 0);

    const remain = Math.max(targetCalories - eaten, 0);

    return {
      consumed: eaten,
      remaining: remain,
      target: targetCalories,
      hasData: targetCalories > 0,
    };
  }, [todayDay, todayLog]);

  const data: ChartData<"doughnut"> = useMemo(
    () => ({
      labels: ["مصرف‌شده", "باقی‌مانده"],
      datasets: [
        {
          data:
            hasData && (consumed > 0 || remaining > 0)
              ? [consumed, remaining || (consumed === 0 ? target : remaining)]
              : hasData
                ? [0, target]
                : [0, 1],
          backgroundColor: ["oklch(0.73 0.19 45)", "oklch(0.7 0 0 / 0.15)"],
          borderWidth: 0,
          cutout: "72%",
        },
      ],
    }),
    [consumed, remaining, target, hasData],
  );

  const options: ChartOptions<"doughnut"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          callbacks: {
            label: (ctx) =>
              hasData ? `${ctx.label}: ${ctx.raw} کالری` : "بدون داده",
          },
        },
      },
    }),
    [hasData],
  );

  const loading = planLoading || logLoading;

  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">کالری امروز</CardTitle>
        <CardDescription>
          {hasData
            ? `هدف روزانه ${target.toLocaleString("fa-IR")}`
            : hasPlan
              ? "هدف کالری امروز مشخص نیست"
              : "برنامه‌ای برای امروز نیست"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-45 sm:h-50 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : !hasData ? (
          <div className="h-45 sm:h-50 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center px-4">
              بعد از فعال شدن برنامه و ثبت وعده‌ها، نمودار اینجا نمایش داده
              می‌شود.
            </p>
          </div>
        ) : (
          <div className="relative h-45 sm:h-50">
            <Doughnut data={data} options={options} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-foreground">
                {consumed.toLocaleString("fa-IR")}
              </span>
              <span className="text-xs text-muted-foreground">کالری</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
