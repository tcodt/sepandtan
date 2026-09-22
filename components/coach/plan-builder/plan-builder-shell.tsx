"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Save,
  Send,
  Settings2,
  Loader2,
  Eye,
  MoreVertical,
  Info,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { WeekStrip } from "./week-strip";
import { PlanMetaForm } from "./plan-meta-form";
import { DayEditor } from "./day-editor";
import { ApplyWeekButton } from "./apply-week-button";
import type { Plan, PlanDay, Goal, Equipment } from "@/lib/types/plan";
import { cn } from "@/lib/utils";

type Props = {
  initialPlan?: Partial<Plan>;
  onSaveDraft: (data: Partial<Plan>) => Promise<void>;
  onPublish?: () => Promise<void>;
  saving?: boolean;
};

function createEmptyWeek(): PlanDay[] {
  return Array.from({ length: 7 }, (_, i) => ({
    dayNumber: i + 1,
    title: `روز ${i + 1}`,
    focus: "",
    isRestDay: false,
    estimatedMinutes: 0,
    exercises: [],
    meals: [],
  }));
}

function cloneDay(day: PlanDay, dayNumber: number): PlanDay {
  return {
    ...day,
    dayNumber,
    title: day.isRestDay
      ? "روز استراحت"
      : day.title || `روز ${((dayNumber - 1) % 7) + 1}`,
    exercises: (day.exercises ?? []).map((e) => ({ ...e })),
    meals: (day.meals ?? []).map((m) => ({ ...m })),
  };
}

function normalizeWeek(week: PlanDay[]): PlanDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const dayNumber = i + 1;
    const existing = week.find((d) => d.dayNumber === dayNumber);
    return existing
      ? cloneDay(existing, dayNumber)
      : cloneDay(
          {
            dayNumber,
            title: `روز ${dayNumber}`,
            focus: "",
            isRestDay: false,
            estimatedMinutes: 0,
            exercises: [],
            meals: [],
          },
          dayNumber,
        );
  });
}

function expandWeek(safeWeek: PlanDay[], durationWeeks: number): PlanDay[] {
  return Array.from({ length: durationWeeks * 7 }, (_, i) => {
    const dayInCycle = (i % 7) + 1;
    return cloneDay(safeWeek[dayInCycle - 1], i + 1);
  });
}

export function PlanBuilderShell({
  initialPlan,
  onSaveDraft,
  onPublish,
  saving,
}: Props) {
  const [title, setTitle] = useState(initialPlan?.title ?? "");
  const [goal, setGoal] = useState<Goal>(
    initialPlan?.goal ?? "general_fitness",
  );
  const [equipment, setEquipment] = useState<Equipment>(
    initialPlan?.equipment ?? "gym",
  );
  const [level, setLevel] = useState<"beginner" | "intermediate" | "advanced">(
    initialPlan?.level ?? "intermediate",
  );
  const [durationWeeks, setDurationWeeks] = useState<4 | 6 | 8>(
    initialPlan?.durationWeeks ?? 4,
  );
  const [priceToman, setPriceToman] = useState<number | null>(
    initialPlan?.priceToman ?? null,
  );

  const [week, setWeek] = useState<PlanDay[]>(
    initialPlan?.weeklyTemplate?.length === 7
      ? initialPlan.weeklyTemplate.map((d) => cloneDay(d, d.dayNumber))
      : createEmptyWeek(),
  );

  const [expandedDays, setExpandedDays] = useState<PlanDay[]>(
    initialPlan?.days?.map((d) => cloneDay(d, d.dayNumber)) ?? [],
  );

  const [selectedDay, setSelectedDay] = useState(1);
  const [showMeta, setShowMeta] = useState(!initialPlan?.title);
  const [publishDialogOpen, setPublishDialogOpen] = useState(false);
  const [weakDaysCount, setWeakDaysCount] = useState(0);

  const currentDay = week.find((d) => d.dayNumber === selectedDay) ??
    week[0] ?? {
      dayNumber: selectedDay,
      title: `روز ${selectedDay}`,
      focus: "",
      isRestDay: false,
      estimatedMinutes: 0,
      exercises: [],
      meals: [],
    };

  const weekStats = useMemo(() => {
    const training = week.filter((d) => !d.isRestDay);
    const totalExercises = week.reduce(
      (s, d) => s + (d.exercises?.length ?? 0),
      0,
    );
    const filled = training.filter(
      (d) => (d.exercises?.length ?? 0) > 0,
    ).length;
    return {
      trainingDays: training.length,
      restDays: week.length - training.length,
      totalExercises,
      filledTrainingDays: filled,
    };
  }, [week]);

  const updateDay = (dayNumber: number, patch: Partial<PlanDay>) => {
    setWeek((prev) =>
      prev.map((d) => (d.dayNumber === dayNumber ? { ...d, ...patch } : d)),
    );
  };

  const buildPayload = (daysOverride?: PlanDay[]): Partial<Plan> => ({
    title,
    goal,
    equipment,
    level,
    durationWeeks,
    durationDays: durationWeeks * 7,
    priceToman,
    weeklyTemplate: week,
    days: daysOverride ?? (expandedDays.length > 0 ? expandedDays : week),
    patternType: "weekly",
  });

  const validateBaseFields = (): boolean => {
    if ((priceToman ?? 0) <= 0) {
      toast.error("قیمت برنامه را وارد کن");
      setShowMeta(true);
      return false;
    }
    if (!title.trim()) {
      toast.error("نام برنامه را وارد کن");
      setShowMeta(true);
      return false;
    }
    return true;
  };

  const handleSave = async (daysOverride?: PlanDay[]): Promise<boolean> => {
    if (!validateBaseFields()) return false;
    try {
      await onSaveDraft(buildPayload(daysOverride));
      return true;
    } catch {
      toast.error("ذخیره ناموفق بود");
      return false;
    }
  };

  const handleSaveAndToast = async () => {
    const ok = await handleSave();
    if (ok) toast.success("ذخیره شد");
  };

  const applyTemplateToFullPlan = async (
    successMessage?: string,
  ): Promise<boolean> => {
    const safeWeek = normalizeWeek(week);
    const expanded = expandWeek(safeWeek, durationWeeks);
    setWeek(safeWeek);
    setExpandedDays(expanded);

    const ok = await handleSave(expanded);
    if (ok && successMessage) toast.success(successMessage);
    return ok;
  };

  const applyWeekToWholePlan = () =>
    applyTemplateToFullPlan(
      `الگوی هفته روی ${durationWeeks.toLocaleString("fa-IR")} هفته اعمال شد`,
    );

  const requestPublish = () => {
    if (!validateBaseFields()) return;
    const trainingDays = week.filter((d) => !d.isRestDay);
    const weakDays = trainingDays.filter((d) => (d.exercises?.length ?? 0) < 3);
    setWeakDaysCount(weakDays.length);
    setPublishDialogOpen(true);
  };

  const confirmPublish = async () => {
    setPublishDialogOpen(false);
    const ok = await applyTemplateToFullPlan();
    if (!ok) return;
    if (onPublish) {
      try {
        await onPublish();
      } catch {
        toast.error("انتشار ناموفق بود");
      }
    }
  };

  const priceLabel =
    priceToman && priceToman > 0
      ? `${priceToman.toLocaleString("fa-IR")} ت`
      : null;

  return (
    <div className="flex flex-col h-full min-h-0 pb-24 md:pb-0">
      {/* ============ Header ============ */}
      <header
        className={cn(
          "sticky top-0 z-30 border-b shrink-0 rounded-full",
          "bg-card/95 border-border shadow-sm shadow-foreground/3",
          "dark:bg-background/80 dark:backdrop-blur-xl dark:shadow-none",
          "dark:border-white/10",
        )}
      >
        <div className="flex items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6 lg:px-8 h-14">
          {/* ---- Left side: back + title ---- */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 h-9 w-9 hover:bg-accent"
              asChild
            >
              <Link href="/coach/plans" aria-label="بازگشت به لیست برنامه‌ها">
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="font-semibold truncate text-sm sm:text-base text-foreground">
                {title || "برنامه بدون نام"}
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <span>
                  {initialPlan?.status === "draft" || !initialPlan
                    ? "پیش‌نویس"
                    : initialPlan.status}
                </span>
                {priceLabel && (
                  <>
                    <span className="text-border">·</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {priceLabel}
                    </span>
                  </>
                )}
                {!showMeta && (
                  <>
                    <span className="text-border">·</span>
                    <span>
                      {weekStats.totalExercises.toLocaleString("fa-IR")} حرکت
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ---- Right side: actions ---- */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* DESKTOP: full inline controls (unchanged) */}
            <div className="hidden md:flex items-center gap-1.5">
              {!showMeta ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-accent"
                  onClick={() => setShowMeta(true)}
                  title="تنظیمات"
                >
                  <Settings2 className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 gap-1.5 hover:bg-accent"
                  onClick={() => {
                    if (!title.trim()) {
                      toast.error("نام برنامه را وارد کن");
                      return;
                    }
                    setShowMeta(false);
                  }}
                  title="بازگشت به ویرایشگر"
                >
                  <Eye className="w-4 h-4" />
                  <span className="hidden lg:inline">ویرایشگر</span>
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "h-9 gap-1.5",
                  "bg-card border-border hover:bg-accent hover:border-foreground/20",
                  "dark:bg-transparent dark:border-white/15 dark:hover:bg-white/5",
                )}
                disabled={saving || showMeta}
                onClick={() => void handleSaveAndToast()}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                ذخیره
              </Button>
            </div>

            {/* MOBILE: ⋯ dropdown with secondary actions */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="گزینه‌های بیشتر"
                    className="h-9 w-9 hover:bg-accent data-[state=open]:bg-accent"
                  >
                    <MoreVertical className="w-4.5 h-4.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  sideOffset={6}
                  className={cn(
                    "w-56 rounded-xl",
                    // LIGHT
                    "bg-card border-border shadow-xl shadow-foreground/8",
                    // DARK
                    "dark:bg-popover dark:border-white/10 dark:shadow-2xl dark:shadow-black/40",
                  )}
                >
                  <DropdownMenuLabel className="text-[11px] text-muted-foreground font-normal flex items-center gap-1.5">
                    <Info className="w-3 h-3" />
                    اطلاعات برنامه
                  </DropdownMenuLabel>

                  {/* Compact status summary so mobile users see it in the menu too */}
                  <div className="px-2 pb-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">وضعیت</span>
                      <span className="font-medium">
                        {initialPlan?.status === "draft" || !initialPlan
                          ? "پیش‌نویس"
                          : initialPlan.status}
                      </span>
                    </div>
                    {priceLabel && (
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">قیمت</span>
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">
                          {priceLabel}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">حرکات</span>
                      <span className="font-medium tabular-nums">
                        {weekStats.totalExercises.toLocaleString("fa-IR")}
                      </span>
                    </div>
                  </div>

                  <DropdownMenuSeparator />

                  {/* Settings / editor toggle */}
                  {!showMeta ? (
                    <DropdownMenuItem
                      onSelect={() => setShowMeta(true)}
                      className="gap-2 cursor-pointer"
                    >
                      <Settings2 className="w-4 h-4" />
                      تنظیمات برنامه
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onSelect={() => {
                        if (!title.trim()) {
                          toast.error("نام برنامه را وارد کن");
                          return;
                        }
                        setShowMeta(false);
                      }}
                      className="gap-2 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      بازگشت به ویرایشگر
                    </DropdownMenuItem>
                  )}

                  {/* Save draft */}
                  <DropdownMenuItem
                    onSelect={() => {
                      if (saving || showMeta) return;
                      void handleSaveAndToast();
                    }}
                    disabled={saving || showMeta}
                    className="gap-2 cursor-pointer"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    ذخیره پیش‌نویس
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Publish — always visible on both mobile & desktop */}
            {onPublish && !showMeta && (
              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
              >
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "h-9 gap-1.5 font-semibold px-2.5 sm:px-3",
                    "shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25",
                    "dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-primary/30",
                  )}
                  disabled={saving}
                  onClick={requestPublish}
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden xs:inline sm:inline">انتشار</span>
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      {/* ============ Content ============ */}
      <div className="flex-1 w-full min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 py-5">
        {showMeta ? (
          <PlanMetaForm
            title={title}
            goal={goal}
            equipment={equipment}
            level={level}
            durationWeeks={durationWeeks}
            priceToman={priceToman}
            onChange={{
              setTitle,
              setGoal,
              setEquipment,
              setLevel,
              setDurationWeeks,
              setPriceToman,
            }}
            onContinue={() => {
              if (!validateBaseFields()) return;
              setShowMeta(false);
            }}
          />
        ) : (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px]",
                  "bg-card border-border text-foreground/80",
                  "dark:bg-white/5 dark:border-white/10 dark:text-foreground",
                )}
              >
                {durationWeeks.toLocaleString("fa-IR")} هفته
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px]",
                  "bg-card border-border text-foreground/80",
                  "dark:bg-white/5 dark:border-white/10 dark:text-foreground",
                )}
              >
                {weekStats.trainingDays.toLocaleString("fa-IR")} روز تمرین
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px]",
                  "bg-card border-border text-foreground/80",
                  "dark:bg-white/5 dark:border-white/10 dark:text-foreground",
                )}
              >
                {weekStats.restDays.toLocaleString("fa-IR")} استراحت
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "text-[11px] font-medium",
                  "bg-primary/10 border-primary/25 text-primary",
                  "dark:bg-primary/10 dark:border-primary/20 dark:text-primary",
                )}
              >
                {weekStats.totalExercises.toLocaleString("fa-IR")} حرکت در هفته
              </Badge>
            </div>

            <WeekStrip
              week={week}
              selectedDay={selectedDay}
              onSelect={setSelectedDay}
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {currentDay.isRestDay
                    ? "روز استراحت"
                    : currentDay.title ||
                      `روز ${selectedDay.toLocaleString("fa-IR")}`}
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {currentDay.isRestDay
                    ? "ریکاوری و تغذیه"
                    : `${(currentDay.exercises?.length ?? 0).toLocaleString("fa-IR")} حرکت · ${(currentDay.meals?.length ?? 0).toLocaleString("fa-IR")} وعده`}
                  {expandedDays.length > 0 && (
                    <span className="text-primary font-medium">
                      {" "}
                      · {expandedDays.length.toLocaleString("fa-IR")} روز
                      تولیدشده
                    </span>
                  )}
                </p>
              </div>

              <ApplyWeekButton
                durationWeeks={durationWeeks}
                onApply={() => {
                  void applyWeekToWholePlan();
                }}
                disabled={saving}
              />
            </div>

            <DayEditor
              day={currentDay}
              onChange={(patch) => updateDay(selectedDay, patch)}
            />
          </div>
        )}
      </div>

      {/* ============ Mobile bottom bar ============ */}
      {!showMeta && (
        <div
          className={cn(
            "md:hidden fixed bottom-0 inset-x-0 z-40 border-t p-3 safe-area-pb",
            "bg-card/95 border-border shadow-[0_-4px_12px_-6px] shadow-foreground/10",
            "dark:bg-background/90 dark:border-white/10 dark:backdrop-blur-xl dark:shadow-none",
          )}
        >
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              className={cn(
                "flex-1 h-11 gap-1.5",
                "bg-card border-border hover:bg-accent",
                "dark:bg-transparent dark:border-white/15 dark:hover:bg-white/5",
              )}
              disabled={saving}
              onClick={() => void handleSaveAndToast()}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              ذخیره
            </Button>
            {onPublish && (
              <motion.div
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 22 }}
                className="flex-1"
              >
                <Button
                  type="button"
                  className={cn(
                    "w-full h-11 gap-1.5 font-semibold",
                    "shadow-sm shadow-primary/20",
                    "dark:shadow-none",
                  )}
                  disabled={saving}
                  onClick={requestPublish}
                >
                  <Send className="w-4 h-4" />
                  انتشار
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      )}

      {/* ============ Publish confirm dialog ============ */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent
          className={cn(
            "rounded-2xl max-w-sm",
            "bg-card border-border shadow-xl shadow-foreground/5",
            "dark:bg-background/95 dark:border-white/10 dark:backdrop-blur-xl dark:shadow-2xl dark:shadow-black/40",
          )}
        >
          <AlertDialogHeader className="text-right space-y-2">
            <AlertDialogTitle>انتشار برنامه؟</AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-relaxed space-y-2">
              <span className="block">
                {weakDaysCount > 0
                  ? `${weakDaysCount.toLocaleString("fa-IR")} روز تمرینی کمتر از ۳ حرکت دارند.`
                  : "برنامه از نظر ساختار آماده به نظر می‌رسد."}
              </span>
              <span className="block text-muted-foreground">
                بعد از انتشار می‌توانی آن را به هنرجویان اختصاص بدهی.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel
              className={cn(
                "border-border bg-card hover:bg-muted/70",
                "dark:border-white/15 dark:bg-transparent dark:hover:bg-white/5",
              )}
            >
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void confirmPublish()}
              className={cn(
                "shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25",
                "dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-primary/30",
              )}
            >
              انتشار
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
