"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { todayMealPlan, type MealType } from "@/lib/data/nutrition";
import { useNutritionStore } from "@/lib/store/nutrition-store";
import { MealCard } from "./meal-card";
import { ReplaceMealSheet } from "./replace-meal-sheet";
import { CalorieSummary } from "./calorie-summary";

export function TodayNutrition() {
  const {
    initToday,
    meals,
    targetCalories,
    markEaten,
    replaceMeal,
    getSelectedMeal,
    consumedCalories,
    eatenCount,
    totalMeals,
  } = useNutritionStore();

  const [replaceType, setReplaceType] = useState<MealType | null>(null);

  useEffect(() => {
    initToday();
  }, [initToday]);

  const activeSlot = todayMealPlan.find((s) => s.type === replaceType);
  const activeLog = meals.find((m) => m.type === replaceType);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 -mr-2">
            <Link href="/dashboard">
              <ArrowRight className="w-4 h-4" />
              داشبورد
            </Link>
          </Button>
          <h1 className="text-lg font-bold text-foreground">رژیم امروز</h1>
          <div className="w-16" />
        </div>

        <CalorieSummary
          consumed={consumedCalories()}
          target={targetCalories}
          eatenCount={eatenCount()}
          totalMeals={totalMeals()}
        />

        <div className="space-y-3">
          {todayMealPlan.map((slot) => {
            const log = meals.find((m) => m.type === slot.type);
            const meal = getSelectedMeal(slot.type);
            if (!log || !meal) return null;

            return (
              <MealCard
                key={slot.type}
                label={slot.label}
                timeLabel={slot.timeLabel}
                meal={meal}
                eaten={log.eaten}
                onToggleEaten={() => {
                  const next = !log.eaten;
                  markEaten(slot.type, next);
                  toast.success(
                    next
                      ? `${slot.label} ثبت شد`
                      : `ثبت ${slot.label} برداشته شد`,
                  );
                }}
                onReplace={() => setReplaceType(slot.type)}
              />
            );
          })}
        </div>

        {eatenCount() === totalMeals() && totalMeals() > 0 && (
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center space-y-1">
            <p className="text-sm font-semibold text-primary">
              آفرین! همه وعده‌های امروز ثبت شد
            </p>
            <p className="text-xs text-muted-foreground">
              فردا دوباره سر بزن تا پیشتاز بمونی
            </p>
          </div>
        )}
      </div>

      {activeSlot && activeLog && (
        <ReplaceMealSheet
          open={!!replaceType}
          onOpenChange={(open) => !open && setReplaceType(null)}
          label={activeSlot.label}
          alternatives={activeSlot.alternatives}
          selectedId={activeLog.selectedMealId}
          onSelect={(mealId) => {
            replaceMeal(activeSlot.type, mealId);
            toast.success("وعده جایگزین شد");
          }}
        />
      )}
    </div>
  );
}
