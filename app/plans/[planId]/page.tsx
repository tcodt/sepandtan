"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  Clock,
  Dumbbell,
  FileText,
  Loader2,
  Utensils,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CoachPlanBadge } from "@/components/common/coach-plan-badge";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useUserStore } from "@/lib/store/user-store";
import {
  getPlanById,
  getCurrentDayNumber,
  getDayFromPlan,
} from "@/lib/api/plans";
import { getCoachNameByIdSync } from "@/lib/api/coaches";
import type { Plan, PlanDay } from "@/lib/types/plan";
import { cn } from "@/lib/utils";

const LEVEL_FA = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
} as const;

const GOAL_FA: Record<string, string> = {
  lose_weight: "کاهش وزن",
  build_muscle: "عضله‌سازی",
  maintain: "حفظ تناسب",
  endurance: "استقامت",
  general_fitness: "آمادگی عمومی",
};

const MEAL_FA: Record<string, string> = {
  breakfast: "صبحانه",
  snack: "میان‌وعده",
  lunch: "ناهار",
  dinner: "شام",
};

function getPlanDays(plan: Plan): PlanDay[] {
  if (
    plan.patternType === "weekly" &&
    Array.isArray(plan.weeklyTemplate) &&
    plan.weeklyTemplate.length > 0
  ) {
    return [...plan.weeklyTemplate].sort((a, b) => a.dayNumber - b.dayNumber);
  }
  return [...(plan.days ?? [])].sort((a, b) => a.dayNumber - b.dayNumber);
}

export default function PlanDetailPage() {
  const params = useParams<{ planId: string }>();
  const router = useRouter();
  const planId = params.planId;

  const {
    isLoading: authLoading,
    isAuthenticated,
    user,
  } = useRequireAuth({
    requireOnboarding: true,
    blockCoach: true,
  });

  const currentPlanId = useUserStore((s) => s.user?.currentPlanId);

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);

  useEffect(() => {
    if (!planId || !user?.id) return;

    let cancelled = false;
    setLoading(true);

    getPlanById(planId)
      .then((data) => {
        if (cancelled) return;

        // فقط برنامه متعلق به کاربر (یا فعلاً بدون owner سخت‌گیرانه برای draft مربی)
        if (data.userId && data.userId !== user.id) {
          toast.error("به این برنامه دسترسی نداری");
          router.replace("/plans");
          return;
        }

        setPlan(data);
        const today = getCurrentDayNumber(data);
        const days = getPlanDays(data);
        const initial =
          days.find(
            (d) => d.dayNumber === ((today - 1) % Math.max(days.length, 1)) + 1,
          )?.dayNumber ??
          days[0]?.dayNumber ??
          1;
        setSelectedDayNumber(
          data.patternType === "weekly"
            ? ((today - 1) % 7) + 1
            : Math.min(today, data.durationDays),
        );
        if (!days.find((d) => d.dayNumber === selectedDayNumber)) {
          setSelectedDayNumber(initial);
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("بارگذاری برنامه ناموفق بود");
          router.replace("/plans");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, user?.id]);

  const days = useMemo(() => (plan ? getPlanDays(plan) : []), [plan]);

  const selectedDay = useMemo(() => {
    if (!plan) return null;
    return (
      getDayFromPlan(plan, selectedDayNumber) ??
      days.find((d) => d.dayNumber === selectedDayNumber) ??
      days[0] ??
      null
    );
  }, [plan, selectedDayNumber, days]);

  if (authLoading || !isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) return null;

  const isActive = plan.id === currentPlanId;
  const isCoachPlan = plan.source === "coach";
  const coachName = isCoachPlan ? getCoachNameByIdSync(plan.coachId) : null;

  return (
    <div className="min-h-screen bg-muted pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 -mr-2">
            <Link href="/plans">
              <ArrowRight className="w-4 h-4" />
              برنامه‌های من
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              toast.message("خروجی PDF به‌زودی فعال می‌شود", {
                description:
                  "فعلاً می‌تونی کل برنامه را در همین صفحه مرور کنی.",
              })
            }
          >
            <FileText className="w-4 h-4" />
            دانلود PDF
          </Button>
        </div>

        {/* Header card */}
        <Card className="border-border/50 bg-card/80 dark:bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-5 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {isActive ? (
                <Badge className="rounded-full bg-primary/15 text-primary border-0">
                  برنامه فعال
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-full">
                  آرشیو
                </Badge>
              )}

              {isCoachPlan ? (
                <CoachPlanBadge coachName={coachName} />
              ) : (
                <Badge variant="outline" className="rounded-full gap-1">
                  <Bot className="w-3 h-3" />
                  هوش مصنوعی
                </Badge>
              )}
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                {plan.title}
              </h1>
              {plan.description && (
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {plan.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs sm:text-sm">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-muted-foreground mb-1">هدف</p>
                <p className="font-medium">{GOAL_FA[plan.goal] ?? plan.goal}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-muted-foreground mb-1">سطح</p>
                <p className="font-medium">{LEVEL_FA[plan.level]}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-muted-foreground mb-1">مدت</p>
                <p className="font-medium">
                  {plan.durationDays.toLocaleString("fa-IR")} روز
                </p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-muted-foreground mb-1">الگو</p>
                <p className="font-medium">
                  {plan.patternType === "weekly" ? "هفتگی" : "کامل"}
                </p>
              </div>
            </div>

            {isCoachPlan && (
              <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                <UserRound className="w-3.5 h-3.5" />
                {coachName ? `مربی: ${coachName}` : "برنامه مربی"}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Day strip */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold">
              {plan.patternType === "weekly" ? "روزهای هفته" : "روزهای برنامه"}
            </h2>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((day) => {
              const active = day.dayNumber === selectedDayNumber;
              return (
                <button
                  key={day.dayNumber}
                  type="button"
                  onClick={() => setSelectedDayNumber(day.dayNumber)}
                  className={cn(
                    "min-w-16 rounded-2xl border px-3 py-2 text-center transition-colors",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-card/60 text-muted-foreground hover:border-primary/30",
                  )}
                >
                  <div className="text-[11px] font-medium">
                    روز {day.dayNumber.toLocaleString("fa-IR")}
                  </div>
                  <div className="text-[10px] mt-0.5 truncate max-w-20">
                    {day.isRestDay ? "استراحت" : day.focus || day.title}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Selected day content */}
        {selectedDay ? (
          <div className="space-y-4">
            <Card className="border-border/50 bg-card/80">
              <CardContent className="p-4 sm:p-5 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground">
                    {selectedDay.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {!selectedDay.isRestDay && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {selectedDay.estimatedMinutes.toLocaleString(
                          "fa-IR",
                        )}{" "}
                        دقیقه
                      </span>
                    )}
                    {selectedDay.isRestDay && (
                      <Badge variant="secondary" className="rounded-full">
                        روز استراحت
                      </Badge>
                    )}
                  </div>
                </div>
                {selectedDay.focus && (
                  <p className="text-sm text-muted-foreground">
                    تمرکز: {selectedDay.focus}
                  </p>
                )}
                {typeof selectedDay.dailyCaloriesTarget === "number" && (
                  <p className="text-xs text-muted-foreground">
                    هدف کالری روز:{" "}
                    {selectedDay.dailyCaloriesTarget.toLocaleString("fa-IR")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Exercises */}
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">تمرینات</h3>
              </div>

              {selectedDay.isRestDay || selectedDay.exercises.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-4 text-sm text-muted-foreground text-center">
                    تمرینی برای این روز ثبت نشده است.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {selectedDay.exercises.map((ex, idx) => (
                    <Card
                      key={`${ex.exerciseId}-${idx}`}
                      className="border-border/50"
                    >
                      <CardContent className="p-3.5 sm:p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {ex.name}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {ex.muscle}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="rounded-full text-[10px]"
                          >
                            {ex.sets} × {ex.reps}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                          <span>استراحت: {ex.restSeconds} ثانیه</span>
                          {ex.notes && <span>نکته: {ex.notes}</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Meals */}
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Utensils className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold">تغذیه</h3>
              </div>

              {selectedDay.meals.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-4 text-sm text-muted-foreground text-center">
                    وعده‌ای برای این روز ثبت نشده است.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {selectedDay.meals.map((meal) => (
                    <Card key={meal.id} className="border-border/50">
                      <CardContent className="p-3.5 sm:p-4 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium">{meal.title}</p>
                          <Badge
                            variant="secondary"
                            className="rounded-full text-[10px]"
                          >
                            {MEAL_FA[meal.type] ?? meal.type}
                          </Badge>
                        </div>
                        {meal.description && (
                          <p className="text-xs text-muted-foreground">
                            {meal.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-1">
                          {typeof meal.calories === "number" && (
                            <span>
                              {meal.calories.toLocaleString("fa-IR")} کالری
                            </span>
                          )}
                          {typeof meal.protein === "number" && (
                            <span>پروتئین {meal.protein}</span>
                          )}
                          {typeof meal.carbs === "number" && (
                            <span>کربوهیدرات {meal.carbs}</span>
                          )}
                          {typeof meal.fat === "number" && (
                            <span>چربی {meal.fat}</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              روزی برای نمایش پیدا نشد.
            </CardContent>
          </Card>
        )}

        {/* Bottom actions */}
        {isActive && (
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button asChild className="h-11 flex-1 font-semibold">
              <Link href="/workout/today">رفتن به تمرین امروز</Link>
            </Button>
            <Button asChild variant="outline" className="h-11 flex-1">
              <Link href="/nutrition">تغذیه امروز</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
