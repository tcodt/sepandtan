"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Apple,
  CheckCircle2,
  Circle,
  Loader2,
  RotateCcw,
  ArrowLeft,
  Utensils,
  Sun,
  Moon,
  Coffee,
  Pizza,
  TrendingUp,
  Flame,
} from "lucide-react";
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

const MEAL_ICONS: Record<PlanMeal["type"], React.ReactNode> = {
  breakfast: <Coffee className="w-4 h-4" />,
  snack: <Pizza className="w-4 h-4" />,
  lunch: <Sun className="w-4 h-4" />,
  dinner: <Moon className="w-4 h-4" />,
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
  const skippedCount = mealStates.filter((s) => s.status === "skipped").length;
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

  // Get status text
  const getStatusText = (status: MealStatus) => {
    switch (status) {
      case "eaten":
        return "ثبت شده";
      case "skipped":
        return "حذف شده";
      default:
        return "در انتظار";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            بارگذاری برنامه غذایی...
          </p>
        </div>
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
      <div className="min-h-screen bg-background pb-20 lg:pb-8">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <Link
                href="/dashboard"
                className="p-2 -mr-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 mt-0.5"
                aria-label="بازگشت"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground flex items-center gap-2 flex-wrap">
                  <Apple className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  <span>رژیم امروز</span>
                  <span className="text-sm font-normal text-muted-foreground bg-muted/50 px-2.5 py-0.5 rounded-full">
                    روز {currentDayNumber}
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                  {targetCalories.toLocaleString("fa-IR")} کالری هدف ·{" "}
                  {meals.length} وعده غذایی
                </p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="sm:mt-1">
              <Link href="/dashboard">داشبورد</Link>
            </Button>
          </div>

          {/* Progress Card */}
          <Card className="border-border/50 bg-linear-to-br from-primary/5 via-muted/30 to-transparent backdrop-blur-sm">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-sm sm:text-base font-medium">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-emerald-500 font-bold">
                      {consumed.toLocaleString("fa-IR")}
                    </span>
                    <span className="text-muted-foreground">از</span>
                    <span className="text-foreground font-semibold">
                      {targetCalories.toLocaleString("fa-IR")}
                    </span>
                    <span className="text-xs text-muted-foreground">کالری</span>
                  </span>
                  <span className="hidden sm:inline text-muted-foreground">
                    ·
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-xs text-muted-foreground">
                        {eatenCount} وعده خورده
                      </span>
                    </span>
                    {skippedCount > 0 && (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        <span className="text-xs text-muted-foreground/60">
                          {skippedCount} وعده حذف
                        </span>
                      </span>
                    )}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Progress value={progress} className="h-2.5 sm:h-3" />
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] sm:text-xs text-muted-foreground">
                  {eatenCount} از {meals.length} وعده
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">
                  {Math.round(progress)}% تکمیل
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Meals Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {meals.map((meal) => {
              const st =
                mealStates.find((s) => s.mealId === meal.id)?.status ||
                "pending";
              const isEaten = st === "eaten";
              const isSkipped = st === "skipped";

              return (
                <motion.div
                  key={meal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  layout
                >
                  <Card
                    className={cn(
                      "border transition-all duration-300",
                      "hover:shadow-md",
                      isEaten && "border-emerald-500/40 bg-emerald-500/5",
                      isSkipped && "border-muted/50 bg-muted/20 opacity-70",
                      !isEaten &&
                        !isSkipped &&
                        "border-border/50 hover:border-primary/20",
                    )}
                  >
                    <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                      {/* Meal Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="text-muted-foreground">
                              {MEAL_ICONS[meal.type]}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                              {MEAL_LABELS[meal.type]}
                            </span>
                            <span
                              className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                isEaten && "text-emerald-500 bg-emerald-500/10",
                                isSkipped &&
                                  "text-muted-foreground bg-muted/50",
                                !isEaten &&
                                  !isSkipped &&
                                  "text-muted-foreground/50 bg-muted/30",
                              )}
                            >
                              {getStatusText(st)}
                            </span>
                          </div>
                          <h3 className="text-sm sm:text-base font-medium text-foreground mt-0.5 truncate">
                            {meal.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 sm:line-clamp-1">
                            {meal.description}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs sm:text-sm font-bold text-foreground tabular-nums">
                            {meal.calories.toLocaleString("fa-IR")}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            کالری
                          </p>
                        </div>
                      </div>

                      {/* Nutrition Info */}
                      {(meal.protein || meal.carbs || meal.fat) && (
                        <div className="flex flex-wrap gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground border-t border-border/30 pt-2">
                          {meal.protein && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">پروتئین</span>
                              <span>{meal.protein}g</span>
                            </span>
                          )}
                          {meal.carbs && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">کربوهیدرات</span>
                              <span>{meal.carbs}g</span>
                            </span>
                          )}
                          {meal.fat && (
                            <span className="flex items-center gap-1">
                              <span className="font-medium">چربی</span>
                              <span>{meal.fat}g</span>
                            </span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-1.5 sm:gap-2 pt-1">
                        <Button
                          size="sm"
                          variant={isEaten ? "default" : "outline"}
                          className={cn(
                            "flex-1 h-8 sm:h-9 text-xs sm:text-sm gap-1.5",
                            isEaten && "bg-emerald-500 hover:bg-emerald-600",
                          )}
                          onClick={() => setStatus(meal.id, "eaten")}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          خوردم
                        </Button>
                        <Button
                          size="sm"
                          variant={isSkipped ? "secondary" : "outline"}
                          className="flex-1 h-8 sm:h-9 text-xs sm:text-sm gap-1.5"
                          onClick={() => setStatus(meal.id, "skipped")}
                        >
                          <Circle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          حذف
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 sm:h-9 w-8 sm:w-9 px-0"
                          onClick={() => setStatus(meal.id, "pending")}
                          aria-label="بازنشانی"
                        >
                          <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Save Button */}
          <div className="lg:sticky lg:bottom-6 lg:mt-6">
            <Button
              className={cn(
                "w-full h-11 sm:h-12 text-base font-semibold gap-2",
                "shadow-lg shadow-primary/20",
                "lg:max-w-md lg:mx-auto lg:block",
              )}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  در حال ذخیره...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Utensils className="w-4 h-4" />
                  ثبت رژیم امروز
                </div>
              )}
            </Button>
          </div>

          {/* Mobile Bottom Padding */}
          <div className="lg:hidden h-4" />
        </div>
      </div>

      {/* Success Notification */}
      <AnimatePresence>
        {showSaved && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring" }}
            className="fixed bottom-24 lg:bottom-8 inset-x-0 z-50 flex justify-center px-4"
          >
            <div className="rounded-full bg-emerald-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base shadow-xl shadow-emerald-500/30 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
              رژیم امروز ثبت شد
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
