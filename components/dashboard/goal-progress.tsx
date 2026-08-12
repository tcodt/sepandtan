"use client";

import { Target, TrendingDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useUserStore } from "@/lib/store/user-store";

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

  // ==================== MOCK ====================
  const currentWeight = 72.4;
  const startWeight = 76.0;
  const targetWeight = 68.0;
  const progress = Math.min(
    100,
    Math.round(
      ((startWeight - currentWeight) / (startWeight - targetWeight)) * 100,
    ),
  );
  // ==============================================

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
        <div className="flex items-end justify-between text-sm">
          <div>
            <p className="text-muted-foreground text-xs">شروع</p>
            <p className="font-semibold text-foreground">{startWeight} کیلو</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground text-xs">الان</p>
            <p className="font-bold text-primary text-lg">
              {currentWeight} کیلو
            </p>
          </div>
          <div className="text-left">
            <p className="text-muted-foreground text-xs">هدف</p>
            <p className="font-semibold text-foreground">{targetWeight} کیلو</p>
          </div>
        </div>

        <Progress value={progress} className="h-2.5" />

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingDown className="w-3.5 h-3.5 text-green-500" />
          <span>{progress}% پیشرفت تا هدف</span>
        </div>
      </CardContent>
    </Card>
  );
}
