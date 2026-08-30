"use client";

import { CheckCircle2, Circle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MealItem } from "@/lib/data/nutrition";

type MealCardProps = {
  label: string;
  timeLabel: string;
  meal: MealItem;
  eaten: boolean;
  onToggleEaten: () => void;
  onReplace: () => void;
};

export function MealCard({
  label,
  timeLabel,
  meal,
  eaten,
  onToggleEaten,
  onReplace,
}: MealCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-4 transition-all",
        eaten ? "border-primary/30 bg-primary/5" : "border-border bg-muted/50",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <span className="text-[11px] text-muted-foreground">
              {timeLabel}
            </span>
          </div>
          <p
            className={cn(
              "text-sm mt-1 font-medium",
              eaten ? "text-primary" : "text-foreground",
            )}
          >
            {meal.title}
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {meal.description}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {meal.calories.toLocaleString("fa-IR")} کالری
            {meal.protein != null && ` · پروتئین ${meal.protein}g`}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleEaten}
          className="shrink-0 mt-0.5"
          aria-label={eaten ? "لغو ثبت وعده" : "ثبت وعده خورده‌شده"}
        >
          {eaten ? (
            <CheckCircle2 className="w-7 h-7 text-primary" />
          ) : (
            <Circle className="w-7 h-7 text-muted-foreground" />
          )}
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          variant={eaten ? "secondary" : "default"}
          size="sm"
          className="flex-1"
          onClick={onToggleEaten}
        >
          {eaten ? "خورده شد ✓" : "ثبت خوردن"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          onClick={onReplace}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          جایگزین
        </Button>
      </div>
    </div>
  );
}
