"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Apple, CheckCircle2, Circle, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useUserPlan } from "@/hooks/use-user-plan";
import {
  getNutritionLogByDate,
  saveNutritionLog,
  updateNutritionLog,
} from "@/lib/api/logs";
import type { PlanMeal } from "@/lib/types/plan";
import { motion, AnimatePresence } from "framer-motion";
import { InlineState } from "../common/states/inline-state";

const MEAL_LABELS: Record<PlanMeal["type"], string> = {
  breakfast: "صبحانه",
  snack: "میان‌وعده",
  lunch: "ناهار",
  dinner: "شام",
};

type MealStatus = "pending" | "eaten" | "skipped" | "replaced";

type LocalMealState = {
  mealId: string;
  status: MealStatus;
};

export function TodayNutrition() {
  const { plan, todayDay, currentDayNumber, isLoading, hasPlan, error, user } =
    useUserPlan();

  const [mealStates, setMealStates] = useState<LocalMealState[]>([]);
  const [logId, setLogId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);

  const meals = useMemo(() => todayDay?.meals ?? [], [todayDay]);
  const targetCalories = todayDay?.dailyCaloriesTarget ?? 0;

  useEffect(() => {
    if (!todayDay || !user?.id) return;

    const today = new Date().toISOString().split("T")[0];
    const defaults: LocalMealState[] = todayDay.meals.map((m) => ({
      mealId: m.id,
      status: "pending" as MealStatus,
    }));
    setMealStates(defaults);

    getNutritionLogByDate(user.id, today)
      .then((log) => {
        if (!log) return;
        setLogId(log.id);
        setMealStates(
          todayDay.meals.map((m) => {
            const found = log.meals.find((x) => x.mealId === m.id);
            return {
              mealId: m.id,
              status: (found?.status as MealStatus) || "pending",
            };
          }),
        );
      })
      .catch(() => {
        // اگر API بالا نباشد، با حالت پیش‌فرض ادامه بده
      });
  }, [todayDay, user?.id, plan?.id]);

  const consumed = useMemo(() => {
    return meals.reduce((sum, m) => {
      const st = mealStates.find((s) => s.mealId === m.id);
      if (st?.status === "eaten") return sum + m.calories;
      return sum;
    }, 0);
  }, [meals, mealStates]);

  const eatenCount = mealStates.filter((s) => s.status === "eaten").length;
  const progress =
    targetCalories > 0 ? Math.min((consumed / targetCalories) * 100, 100) : 0;

  const setStatus = (mealId: string, status: MealStatus) => {
    setMealStates((prev) =>
      prev.map((m) => (m.mealId === mealId ? { ...m, status } : m)),
    );
  };

  const handleSave = async () => {
    if (!user?.id || !plan?.id) {
      toast.error("کاربر یا برنامه پیدا نشد");
      return;
    }

    setSaving(true);
    const payload = {
      userId: user.id,
      planId: plan.id,
      date: new Date().toISOString().split("T")[0],
      meals: mealStates.map((m) => ({
        mealId: m.mealId,
        status: m.status,
      })),
    };

    try {
      if (logId) {
        await updateNutritionLog(logId, payload);
      } else {
        const saved = await saveNutritionLog(payload);
        setLogId(saved.id);
      }

      // حذف toast.success و فقط نمایش نوتیفیکیشن سفارشی
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    } catch (e) {
      console.error(e);
      toast.error("خطا در ذخیره‌سازی", {
        description: "لطفاً دوباره تلاش کنید",
      });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !hasPlan || !todayDay) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-6">
          <InlineState
            type={error ? "error" : "empty-nutrition"}
            onRetry={error ? () => window.location.reload() : undefined}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Apple className="w-5 h-5 text-primary" />
                رژیم امروز
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                روز {currentDayNumber} — هدف{" "}
                {targetCalories.toLocaleString("fa-IR")} کالری
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">داشبورد</Link>
            </Button>
          </div>

          <Card className="border-border bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {consumed.toLocaleString("fa-IR")} از{" "}
                {targetCalories.toLocaleString("fa-IR")} کالری · {eatenCount} از{" "}
                {meals.length} وعده
              </CardTitle>
              <Progress value={progress} className="h-2 mt-2" />
            </CardHeader>
          </Card>

          <div className="space-y-3">
            {meals.map((meal) => {
              const st =
                mealStates.find((s) => s.mealId === meal.id)?.status ||
                "pending";
              const isEaten = st === "eaten";
              const isSkipped = st === "skipped";

              return (
                <Card
                  key={meal.id}
                  className={cn(
                    "border transition-colors",
                    isEaten && "border-primary/30 bg-primary/5",
                    isSkipped && "opacity-60",
                  )}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          {MEAL_LABELS[meal.type]}
                        </p>
                        <p className="text-sm font-medium text-foreground mt-0.5">
                          {meal.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {meal.description}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                          {meal.calories.toLocaleString("fa-IR")} کالری
                          {meal.protein ? ` · پروتئین ${meal.protein}` : ""}
                        </p>
                      </div>
                      {isEaten ? (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={isEaten ? "default" : "outline"}
                        className="flex-1"
                        onClick={() => setStatus(meal.id, "eaten")}
                      >
                        خوردم
                      </Button>
                      <Button
                        size="sm"
                        variant={isSkipped ? "secondary" : "outline"}
                        className="flex-1"
                        onClick={() => setStatus(meal.id, "skipped")}
                      >
                        رد کردم
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setStatus(meal.id, "pending")}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button
            className="w-full h-11"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال ذخیره...
              </>
            ) : (
              "ثبت رژیم امروز"
            )}
          </Button>
        </div>
      </div>

      {/* انیمیشن نوتیفیکیشن موفقیت */}
      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 inset-x-0 z-50 flex justify-center px-4 lg:bottom-8"
          >
            <div className="rounded-full bg-primary text-primary-foreground px-6 py-3 text-sm shadow-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              رژیم امروز ثبت شد ✓
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
