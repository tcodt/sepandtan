"use client";

import { useEffect, useMemo, useState } from "react";
import { Target, TrendingDown, TrendingUp, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserStore } from "@/lib/store/user-store";
import { getWeightLogs } from "@/lib/api/logs";
import type { WeightLog } from "@/lib/types/plan";

const goalLabels: Record<string, string> = {
  lose_weight: "کاهش وزن",
  build_muscle: "افزایش عضله",
  maintain: "حفظ تناسب",
  endurance: "استقامت",
  general_fitness: "آمادگی عمومی",
};

export function GoalProgress() {
  const user = useUserStore((s) => s.user);
  const goal = user?.goal ? goalLabels[user.goal] : "تعیین‌نشده";

  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getWeightLogs(user.id)
      .then((logs) => setWeightLogs(logs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.id]);

  const { startWeight, currentWeight, targetWeight, progress, direction } =
    useMemo(() => {
      const start =
        weightLogs.length > 0
          ? weightLogs[0].weight
          : (user?.bodyInfo?.weight ?? null);

      const current =
        weightLogs.length > 0
          ? weightLogs[weightLogs.length - 1].weight
          : (user?.bodyInfo?.weight ?? null);

      const target =
        user?.targetWeight ??
        (user?.goal === "lose_weight" && current
          ? Math.round(current * 0.92)
          : current);

      if (start == null || current == null || target == null) {
        return {
          startWeight: null,
          currentWeight: null,
          targetWeight: null,
          progress: 0,
          direction: "neutral" as const,
        };
      }

      // کاهش وزن
      if (user?.goal === "lose_weight") {
        const total = start - target;
        const done = start - current;
        const pct =
          total > 0
            ? Math.min(100, Math.max(0, Math.round((done / total) * 100)))
            : 0;
        return {
          startWeight: start,
          currentWeight: current,
          targetWeight: target,
          progress: pct,
          direction: "down" as const,
        };
      }

      // عضله‌سازی / افزایش
      if (user?.goal === "build_muscle") {
        const total = target - start;
        const done = current - start;
        const pct =
          total > 0
            ? Math.min(100, Math.max(0, Math.round((done / total) * 100)))
            : 0;
        return {
          startWeight: start,
          currentWeight: current,
          targetWeight: target,
          progress: pct,
          direction: "up" as const,
        };
      }

      // حفظ / عمومی
      const diff = Math.abs(current - (target || current));
      const pct = diff <= 1 ? 100 : Math.max(0, 100 - Math.round(diff * 10));
      return {
        startWeight: start,
        currentWeight: current,
        targetWeight: target,
        progress: pct,
        direction: "neutral" as const,
      };
    }, [user, weightLogs]);

  if (loading) {
    return (
      <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Target className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">هدف فعلی</CardTitle>
            <CardDescription>{goal}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {startWeight == null ||
        currentWeight == null ||
        targetWeight == null ? (
          <p className="text-sm text-muted-foreground">
            هنوز وزن یا هدفی ثبت نشده است.
          </p>
        ) : (
          <>
            <div className="flex items-end justify-between text-sm">
              <div>
                <p className="text-muted-foreground text-xs">شروع</p>
                <p className="font-semibold text-foreground">
                  {startWeight.toLocaleString("fa-IR")} کیلو
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground text-xs">الان</p>
                <p className="font-bold text-primary text-lg">
                  {currentWeight.toLocaleString("fa-IR")} کیلو
                </p>
              </div>
              <div className="text-left">
                <p className="text-muted-foreground text-xs">هدف</p>
                <p className="font-semibold text-foreground">
                  {targetWeight.toLocaleString("fa-IR")} کیلو
                </p>
              </div>
            </div>

            <Progress value={progress} className="h-2.5" />

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {direction === "down" ? (
                <TrendingDown className="w-3.5 h-3.5 text-green-500" />
              ) : direction === "up" ? (
                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Target className="w-3.5 h-3.5 text-primary" />
              )}
              <span>{progress.toLocaleString("fa-IR")}% پیشرفت تا هدف</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
