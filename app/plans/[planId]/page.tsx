"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  ChevronDown,
  Clock,
  Dumbbell,
  FileText,
  Flame,
  Loader2,
  Play,
  Utensils,
  UserRound,
} from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import { toast } from "sonner";

import "swiper/css";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CoachPlanBadge } from "@/components/common/coach-plan-badge";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useUserPlanAccesses } from "@/hooks/use-user-plan-accesses";
import {
  formatAccessDates,
  statusLabel,
} from "@/components/plans/plan-access-card";
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
  const { accesses, isLoading: accessesLoading } = useUserPlanAccesses();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [showAccessDetails, setShowAccessDetails] = useState(false);

  const swiperRef = useRef<SwiperClass | null>(null);

  const access = useMemo(
    () => accesses.find((a) => a.planId === planId || a.id === planId),
    [accesses, planId],
  );

  useEffect(() => {
    if (!planId || !user?.id) return;

    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);

    getPlanById(planId)
      .then((data) => {
        if (cancelled) return;

        if (data.userId && data.userId !== user.id) {
          toast.error("به این برنامه دسترسی نداری");
          router.replace("/plans");
          return;
        }

        setPlan(data);

        const today = getCurrentDayNumber(data);
        const days = getPlanDays(data);

        const initialDay =
          data.patternType === "weekly"
            ? ((today - 1) % 7) + 1
            : Math.min(today, data.durationDays);

        const exists = days.some((d) => d.dayNumber === initialDay);
        setSelectedDayNumber(exists ? initialDay : (days[0]?.dayNumber ?? 1));
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
  }, [planId, user?.id, router]);

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

  const selectedIndex = useMemo(
    () => days.findIndex((d) => d.dayNumber === selectedDayNumber),
    [days, selectedDayNumber],
  );

  // Auto-center the active day in the swiper
  useEffect(() => {
    if (selectedIndex < 0 || !swiperRef.current) return;
    swiperRef.current.slideTo(selectedIndex, 300);
  }, [selectedIndex]);

  const handlePdfDownload = () => {
    toast.message("خروجی PDF به‌زودی فعال می‌شود", {
      description: "فعلاً می‌تونی کل برنامه را در همین صفحه مرور کنی.",
    });
  };

  if (authLoading || !isAuthenticated || loading || accessesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-muted px-4 py-8">
        <div className="max-w-lg mx-auto text-center space-y-4">
          <p className="text-muted-foreground">برنامه پیدا نشد.</p>
          <Button asChild variant="outline">
            <Link href="/plans">بازگشت به برنامه‌ها</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isActive = plan.id === currentPlanId || access?.status === "active";
  const isCoachPlan = plan.source === "coach";
  const coachName = isCoachPlan ? getCoachNameByIdSync(plan.coachId) : null;

  return (
    <div className="min-h-screen bg-muted pb-28 sm:pb-24">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ms-2 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Link href="/plans" aria-label="بازگشت به برنامه‌ها">
              <ArrowRight className="size-4" />
              <span className="hidden sm:inline">برنامه‌های من</span>
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handlePdfDownload}
          >
            <FileText className="size-4" />
            <span className="hidden sm:inline">دانلود PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-5 px-4 py-5 sm:px-6 sm:py-8">
        {/* Header card */}
        <Card className="overflow-hidden border-border/50 bg-card/80 dark:bg-card/60 backdrop-blur-sm">
          <CardContent className="space-y-4 p-4 sm:p-5">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              {isActive ? (
                <Badge className="rounded-full border-0 bg-primary/15 text-primary">
                  برنامه فعال
                </Badge>
              ) : (
                <Badge variant="outline" className="rounded-full">
                  آرشیو
                </Badge>
              )}

              {access && (
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    access.status === "active" && "bg-primary/15 text-primary",
                    access.status === "pending_activation" &&
                      "bg-amber-500/15 text-amber-600 dark:text-amber-400",
                    access.status !== "active" &&
                      access.status !== "pending_activation" &&
                      "bg-muted text-muted-foreground",
                  )}
                >
                  {statusLabel(access.status)}
                </span>
              )}

              {isCoachPlan ? (
                <CoachPlanBadge coachName={coachName} />
              ) : (
                <Badge variant="outline" className="gap-1 rounded-full">
                  <Bot className="size-3" />
                  هوش مصنوعی
                </Badge>
              )}
            </div>

            {/* Title & description */}
            <div>
              <h1 className="text-xl font-bold leading-snug text-foreground sm:text-2xl">
                {plan.title ?? access?.planTitle ?? "برنامه تمرینی"}
              </h1>
              {plan.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {plan.description}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4 sm:text-sm">
              <StatBox label="هدف" value={GOAL_FA[plan.goal] ?? plan.goal} />
              <StatBox label="سطح" value={LEVEL_FA[plan.level]} />
              <StatBox
                label="مدت"
                value={`${plan.durationDays.toLocaleString("fa-IR")} روز`}
              />
              <StatBox
                label="الگو"
                value={plan.patternType === "weekly" ? "هفتگی" : "کامل"}
              />
            </div>

            {isCoachPlan && (
              <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <UserRound className="size-3.5" />
                {coachName ? `مربی: ${coachName}` : "برنامه مربی"}
              </p>
            )}

            {/* Collapsible access details */}
            {access && (
              <div className="rounded-xl border border-border/60 bg-background/50">
                <button
                  type="button"
                  onClick={() => setShowAccessDetails((v) => !v)}
                  aria-expanded={showAccessDetails}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-start text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span>جزئیات دسترسی</span>
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform",
                      showAccessDetails && "rotate-180",
                    )}
                  />
                </button>

                {showAccessDetails && (
                  <div className="space-y-3 border-t border-border/60 p-3">
                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div className="rounded-lg border border-border bg-card p-2.5">
                        <p className="mb-1 text-muted-foreground">مدت دسترسی</p>
                        <p className="font-semibold">
                          {access.durationDays.toLocaleString("fa-IR")} روز
                        </p>
                      </div>
                      <div className="rounded-lg border border-border bg-card p-2.5">
                        <p className="mb-1 text-muted-foreground">
                          مبلغ پرداختی
                        </p>
                        <p className="font-semibold">
                          {access.pricePaid.toLocaleString("fa-IR")} تومان
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatAccessDates(access)}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Day strip — Swiper */}
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-primary" />
            <h2 className="text-sm font-semibold">
              {plan.patternType === "weekly" ? "روزهای هفته" : "روزهای برنامه"}
            </h2>
          </div>

          <div className="relative -mx-4 sm:mx-0">
            <Swiper
              modules={[FreeMode]}
              slidesPerView="auto"
              spaceBetween={8}
              onSwiper={(s) => (swiperRef.current = s)}
              className="px-4! sm:px-0! py-1! [&_.swiper-wrapper]:items-stretch!"
            >
              {days.map((day) => {
                const active = day.dayNumber === selectedDayNumber;
                return (
                  <SwiperSlide key={day.dayNumber} className="w-auto!">
                    <button
                      type="button"
                      onClick={() => setSelectedDayNumber(day.dayNumber)}
                      aria-pressed={active}
                      className={cn(
                        "min-w-17 rounded-2xl border px-3 py-2 text-center transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        active
                          ? "border-primary bg-primary/10 text-primary shadow-sm"
                          : day.isRestDay
                            ? "border-dashed border-border/60 bg-card/40 text-muted-foreground hover:border-primary/30"
                            : "border-border/60 bg-card/60 text-muted-foreground hover:border-primary/30 hover:text-foreground",
                      )}
                    >
                      <div className="text-[11px] font-semibold">
                        روز {day.dayNumber.toLocaleString("fa-IR")}
                      </div>
                      <div className="mt-0.5 max-w-18 truncate text-[10px]">
                        {day.isRestDay
                          ? "استراحت"
                          : day.focus || day.title || "—"}
                      </div>
                    </button>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        </section>

        {/* Selected day content */}
        {selectedDay ? (
          <div className="space-y-4">
            {/* Day summary */}
            <Card className="border-border/50 bg-card/80">
              <CardContent className="space-y-2 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-foreground">
                    {selectedDay.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {!selectedDay.isRestDay && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="size-3.5" />
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
                  <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Flame className="size-3.5" />
                    هدف کالری روز:{" "}
                    {selectedDay.dailyCaloriesTarget.toLocaleString("fa-IR")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Exercises */}
            <section className="space-y-2">
              <div className="flex items-center gap-2">
                <Dumbbell className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">تمرینات</h3>
                {!selectedDay.isRestDay && selectedDay.exercises.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({selectedDay.exercises.length.toLocaleString("fa-IR")})
                  </span>
                )}
              </div>

              {selectedDay.isRestDay || selectedDay.exercises.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    {selectedDay.isRestDay
                      ? "امروز روز استراحته — به بدنت فرصت ریکاوری بده."
                      : "تمرینی برای این روز ثبت نشده است."}
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {selectedDay.exercises.map((ex, idx) => (
                    <Card
                      key={`${ex.exerciseId}-${idx}`}
                      className="border-border/50 transition-colors hover:border-primary/20"
                    >
                      <CardContent className="p-3.5 sm:p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground">
                              {ex.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {ex.muscle}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="shrink-0 rounded-full text-[10px]"
                          >
                            {ex.sets} × {ex.reps}
                          </Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                          <span>استراحت: {ex.restSeconds} ثانیه</span>
                          {ex.notes && (
                            <span className="truncate">نکته: {ex.notes}</span>
                          )}
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
                <Utensils className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">تغذیه</h3>
                {selectedDay.meals.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    ({selectedDay.meals.length.toLocaleString("fa-IR")})
                  </span>
                )}
              </div>

              {selectedDay.meals.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    وعده‌ای برای این روز ثبت نشده است.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {selectedDay.meals.map((meal) => (
                    <Card
                      key={meal.id}
                      className="border-border/50 transition-colors hover:border-primary/20"
                    >
                      <CardContent className="space-y-1 p-3.5 sm:p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate font-medium">{meal.title}</p>
                          <Badge
                            variant="secondary"
                            className="shrink-0 rounded-full text-[10px]"
                          >
                            {MEAL_FA[meal.type] ?? meal.type}
                          </Badge>
                        </div>
                        {meal.description && (
                          <p className="text-xs text-muted-foreground">
                            {meal.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-3 pt-1 text-[11px] text-muted-foreground">
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
      </div>

      {/* Sticky bottom actions */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3 sm:px-6">
          {isActive ? (
            <>
              <Button asChild className="h-11 flex-1 gap-2 font-semibold">
                <Link href="/workout/today">
                  <Play className="size-4" />
                  شروع تمرین امروز
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="hidden h-11 flex-1 sm:inline-flex"
              >
                <Link href="/nutrition">تغذیه امروز</Link>
              </Button>
            </>
          ) : (
            <Button
              asChild
              variant="outline"
              className="h-11 flex-1 font-medium"
            >
              <Link href="/plans">بازگشت به برنامه‌ها</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- Small internal component ---------- */

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/50 p-3">
      <p className="mb-1 text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
