"use client";

import { Progress } from "@/components/ui/progress";
import { Flame } from "lucide-react";

type CalorieSummaryProps = {
  consumed: number;
  target: number;
  eatenCount: number;
  totalMeals: number;
};

export function CalorieSummary({
  consumed,
  target,
  eatenCount,
  totalMeals,
}: CalorieSummaryProps) {
  const remaining = Math.max(target - consumed, 0);
  const progress = Math.min((consumed / target) * 100, 100);

  return (
    <div className="rounded-2xl border border-border bg-muted/50 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Flame className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">کالری امروز</p>
            <p className="text-xs text-muted-foreground">
              {eatenCount} از {totalMeals} وعده ثبت شده
            </p>
          </div>
        </div>
        <div className="text-left">
          <p className="text-lg font-bold text-foreground tabular-nums">
            {consumed.toLocaleString("fa-IR")}
          </p>
          <p className="text-[11px] text-muted-foreground">
            از {target.toLocaleString("fa-IR")}
          </p>
        </div>
      </div>

      <Progress value={progress} className="h-2.5" />

      <div className="grid grid-cols-2 gap-3 text-center">
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="text-xs text-muted-foreground">مصرف‌شده</p>
          <p className="text-sm font-semibold text-foreground mt-0.5">
            {consumed.toLocaleString("fa-IR")}
          </p>
        </div>
        <div className="rounded-xl bg-muted/60 p-3">
          <p className="text-xs text-muted-foreground">باقی‌مانده</p>
          <p className="text-sm font-semibold text-primary mt-0.5">
            {remaining.toLocaleString("fa-IR")}
          </p>
        </div>
      </div>
    </div>
  );
}
