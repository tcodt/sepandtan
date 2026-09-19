"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
    exercises: day.exercises.map((e) => ({ ...e })),
    meals: day.meals.map((m) => ({ ...m })),
  };
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

  const currentDay = week.find((d) => d.dayNumber === selectedDay) ?? week[0];

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

  const handleSave = async (daysOverride?: PlanDay[]) => {
    if ((priceToman ?? 0) <= 0) {
      toast.error("قیمت برنامه را وارد کن");
      return false;
    }
    if (!title.trim()) {
      toast.error("نام برنامه را وارد کن");
      return false;
    }

    try {
      await onSaveDraft(buildPayload(daysOverride));
      toast.success("ذخیره شد");
      return true;
    } catch {
      toast.error("ذخیره ناموفق بود");
      return false;
    }
  };

  const applyWeekToWholePlan = async () => {
    // اطمینان از ۷ روز کامل
    const safeWeek = Array.from({ length: 7 }, (_, i) => {
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

    const expanded = Array.from({ length: durationWeeks * 7 }, (_, i) => {
      const dayInCycle = (i % 7) + 1;
      const template = safeWeek[dayInCycle - 1];
      return cloneDay(template, i + 1);
    });

    setWeek(safeWeek);
    setExpandedDays(expanded);

    const ok = await handleSave(expanded);
    if (ok) {
      toast.success(
        `الگوی هفته روی ${durationWeeks.toLocaleString("fa-IR")} هفته اعمال و ذخیره شد`,
      );
    }
  };

  const requestPublish = () => {
    if (!title.trim()) {
      toast.error("نام برنامه را وارد کنید");
      return;
    }
    if ((priceToman ?? 0) <= 0) {
      toast.error("قیمت برنامه را وارد کن");
      return;
    }

    const trainingDays = week.filter((d) => !d.isRestDay);
    const weakDays = trainingDays.filter((d) => d.exercises.length < 3);
    setWeakDaysCount(weakDays.length);
    setPublishDialogOpen(true);
  };

  const confirmPublish = async () => {
    setPublishDialogOpen(false);

    // قبل از انتشار، هفته را روی کل برنامه اعمال و ذخیره کن
    const safeWeek = Array.from({ length: 7 }, (_, i) => {
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

    const expanded = Array.from({ length: durationWeeks * 7 }, (_, i) => {
      const dayInCycle = (i % 7) + 1;
      return cloneDay(safeWeek[dayInCycle - 1], i + 1);
    });

    setWeek(safeWeek);
    setExpandedDays(expanded);

    const ok = await handleSave(expanded);
    if (!ok) return;

    if (onPublish) {
      try {
        await onPublish();
      } catch {
        toast.error("انتشار ناموفق بود");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 h-14 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/coach/plans">
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="font-semibold truncate">
                {title || "برنامه بدون نام"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {initialPlan?.status === "draft" || !initialPlan
                  ? "پیش‌نویس"
                  : initialPlan.status}
                {priceToman
                  ? ` · ${priceToman.toLocaleString("fa-IR")} تومان`
                  : ""}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 hidden sm:flex"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              <Save className="w-4 h-4" />
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled
              title="به زودی"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">پیش‌نمایش</span>
            </Button>

            {onPublish && (
              <Button
                size="sm"
                onClick={requestPublish}
                disabled={saving || !title.trim()}
              >
                انتشار
              </Button>
            )}
          </div>
        </div>
      </header>

      {showMeta ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md">
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
                if ((priceToman ?? 0) <= 0) {
                  toast.error("قیمت برنامه را وارد کن");
                  return;
                }
                setShowMeta(false);
                void handleSave();
              }}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="sticky top-14 z-20 border-b border-white/10 bg-black/30 backdrop-blur-lg">
            <div className="max-w-6xl mx-auto">
              <WeekStrip
                days={week}
                selectedDay={selectedDay}
                onSelect={setSelectedDay}
                onToggleRest={(dayNumber) => {
                  const day = week.find((d) => d.dayNumber === dayNumber);
                  if (!day) return;
                  updateDay(dayNumber, {
                    isRestDay: !day.isRestDay,
                    exercises: !day.isRestDay ? [] : day.exercises,
                    title: !day.isRestDay ? "روز استراحت" : `روز ${dayNumber}`,
                    focus: !day.isRestDay ? "Recovery" : day.focus,
                  });
                }}
              />
            </div>
          </div>

          <main className="flex-1 max-w-6xl mx-auto w-full p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-lg font-bold">
                  {currentDay.isRestDay
                    ? "روز استراحت"
                    : currentDay.title || `روز ${selectedDay}`}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {currentDay.isRestDay
                    ? "این روز برای ریکاوری در نظر گرفته شده"
                    : `${currentDay.exercises.length.toLocaleString("fa-IR")} حرکت`}
                  {expandedDays.length > 0 && (
                    <span className="mr-2 text-primary">
                      · {expandedDays.length.toLocaleString("fa-IR")} روز
                      تولیدشده
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ApplyWeekButton
                  durationWeeks={durationWeeks}
                  onApply={applyWeekToWholePlan}
                  disabled={saving}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowMeta(true)}
                >
                  تنظیمات برنامه
                </Button>
              </div>
            </div>

            <DayEditor
              day={currentDay}
              onChange={(patch) => updateDay(selectedDay, patch)}
            />
          </main>
        </>
      )}

      {/* Publish confirmation - Shadcn only */}
      <AlertDialog open={publishDialogOpen} onOpenChange={setPublishDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>انتشار برنامه؟</AlertDialogTitle>
            <AlertDialogDescription>
              {weakDaysCount > 0
                ? `${weakDaysCount.toLocaleString("fa-IR")} روز تمرینی کمتر از ۳ حرکت دارند. بعد از انتشار، برنامه برای اختصاص به هنرجو آماده می‌شود.`
                : "بعد از انتشار، برنامه برای اختصاص به هنرجو آماده می‌شود."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmPublish()}>
              انتشار
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
