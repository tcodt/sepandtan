"use client";

import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Activity, Flame, Target, TrendingDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserPlan } from "@/hooks/use-user-plan";
import type { WeightLog, WorkoutLog } from "@/lib/types/plan";

const goalLabels: Record<string, string> = {
  lose_weight: "کاهش وزن",
  build_muscle: "عضله‌سازی",
  maintain: "حفظ تناسب",
  endurance: "استقامت",
  general_fitness: "آمادگی عمومی",
};

type StatItem = {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
};

type Props = {
  weights?: WeightLog[];
  workouts?: WorkoutLog[];
  isLoading?: boolean;
};

export function StatsCards({
  weights = [],
  workouts = [],
  isLoading = false,
}: Props) {
  const { user, todayDay, plan, isLoading: planLoading } = useUserPlan();

  const stats: StatItem[] = useMemo(() => {
    const latestWeight =
      weights.length > 0
        ? weights[weights.length - 1].weight
        : user?.bodyInfo?.weight;

    const prevWeight =
      weights.length > 1 ? weights[weights.length - 2].weight : undefined;

    let weightChange = "ثبت نشده";
    let weightChangeType: StatItem["changeType"] = "neutral";

    if (latestWeight != null && prevWeight != null) {
      const diff = Number((latestWeight - prevWeight).toFixed(1));
      if (diff < 0) {
        weightChange = `${diff.toLocaleString("fa-IR")} از قبل`;
        weightChangeType = "positive";
      } else if (diff > 0) {
        weightChange = `+${diff.toLocaleString("fa-IR")} از قبل`;
        weightChangeType = "negative";
      } else {
        weightChange = "بدون تغییر";
      }
    } else if (latestWeight != null) {
      weightChange = "آخرین وزن ثبت‌شده";
    }

    const calorieTarget = todayDay?.dailyCaloriesTarget;
    const goalLabel = user?.goal ? goalLabels[user.goal] : "تعیین‌نشده";

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekLogs = workouts.filter((log) => {
      const d = new Date(log.date);
      return d >= weekAgo;
    });
    const weekDone = weekLogs.length;
    const weekTarget = 5;
    const weekPct = Math.round((weekDone / weekTarget) * 100);

    return [
      {
        label: "وزن فعلی",
        value:
          latestWeight != null
            ? `${latestWeight.toLocaleString("fa-IR")} کیلو`
            : "—",
        change: weightChange,
        changeType: weightChangeType,
        icon: TrendingDown,
      },
      {
        label: "کالری هدف امروز",
        value:
          calorieTarget != null ? calorieTarget.toLocaleString("fa-IR") : "—",
        change: todayDay ? "بر اساس برنامه شخصی" : "برنامه فعال نیست",
        changeType: "neutral" as const,
        icon: Flame,
      },
      {
        label: "تمرین این هفته",
        value: `${weekDone.toLocaleString("fa-IR")} از ${weekTarget.toLocaleString("fa-IR")}`,
        change: `${weekPct.toLocaleString("fa-IR")}٪ تکمیل`,
        changeType: weekPct >= 60 ? "positive" : "neutral",
        icon: Activity,
      },
      {
        label: "هدف اصلی",
        value: goalLabel,
        change: plan ? "برنامه فعال" : "بدون برنامه",
        changeType: plan ? "positive" : "neutral",
        icon: Target,
      },
    ];
  }, [user, todayDay, plan, weights, workouts]);

  if (isLoading || planLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border bg-muted/50 backdrop-blur-sm">
            <CardContent className="p-4 sm:p-5 flex items-center justify-center h-24">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="border-border bg-muted/50 backdrop-blur-sm"
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  {stat.change && (
                    <p
                      className={cn(
                        "text-[11px] sm:text-xs",
                        stat.changeType === "positive" &&
                          "text-green-600 dark:text-green-400",
                        stat.changeType === "negative" && "text-red-500",
                        stat.changeType === "neutral" &&
                          "text-muted-foreground",
                      )}
                    >
                      {stat.change}
                    </p>
                  )}
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
