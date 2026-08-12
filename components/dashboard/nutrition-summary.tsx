"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Apple, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNutritionStore } from "@/lib/store/nutrition-store";
import { todayMealPlan, mealTypeLabels } from "@/lib/data/nutrition";

export function NutritionSummary() {
  const {
    initToday,
    meals,
    targetCalories,
    getSelectedMeal,
    consumedCalories,
    eatenCount,
    totalMeals,
  } = useNutritionStore();

  useEffect(() => {
    initToday();
  }, [initToday]);

  const consumed = consumedCalories();
  const target = targetCalories;
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
              {target.toLocaleString("fa-IR")} کالری · {eatenCount()} از{" "}
              {totalMeals()} وعده
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <Progress value={progress} className="h-2" />

        <div className="space-y-2">
          {todayMealPlan.map((slot) => {
            const log = meals.find((m) => m.type === slot.type);
            const meal = getSelectedMeal(slot.type);
            if (!log || !meal) return null;

            return (
              <div
                key={slot.type}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span
                  className={
                    log.eaten
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }
                >
                  {mealTypeLabels[slot.type]}
                </span>
                <span className="text-muted-foreground tabular-nums shrink-0">
                  {meal.calories.toLocaleString("fa-IR")} کالری
                  {log.eaten ? " ✓" : ""}
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
