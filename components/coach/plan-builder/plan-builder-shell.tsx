"use client";

import { useState } from "react";
import { ArrowRight, Eye, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeekStrip } from "./week-strip";
import { PlanMetaForm } from "./plan-meta-form";
import { DayEditor } from "./day-editor";
import { ApplyWeekButton } from "./apply-week-button";
import type { Plan, PlanDay, Goal, Equipment } from "@/lib/types/plan";
import { toast } from "sonner";

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

  const [week, setWeek] = useState<PlanDay[]>(
    initialPlan?.weeklyTemplate?.length === 7
      ? initialPlan.weeklyTemplate
      : createEmptyWeek(),
  );

  const [expandedDays, setExpandedDays] = useState<PlanDay[]>(
    initialPlan?.days ?? [],
  );

  const [selectedDay, setSelectedDay] = useState(1);
  const [showMeta, setShowMeta] = useState(!initialPlan?.title);

  const currentDay = week.find((d) => d.dayNumber === selectedDay) ?? week[0];

  const updateDay = (dayNumber: number, patch: Partial<PlanDay>) => {
    setWeek((prev) =>
      prev.map((d) => (d.dayNumber === dayNumber ? { ...d, ...patch } : d)),
    );
  };

  const applyWeekToWholePlan = () => {
    const expanded = Array.from({ length: durationWeeks * 7 }, (_, i) => {
      const dayInCycle = (i % 7) + 1;
      const template = week.find((d) => d.dayNumber === dayInCycle)!;
      return {
        ...template,
        dayNumber: i + 1,
        title: template.isRestDay
          ? "روز استراحت"
          : template.title || `روز ${dayInCycle}`,
      };
    });
    setExpandedDays(expanded);
    toast.success("الگوی هفته روی کل برنامه اعمال شد");
  };

  const handleSave = async () => {
    await onSaveDraft({
      title,
      goal,
      equipment,
      level,
      durationWeeks,
      durationDays: durationWeeks * 7,
      weeklyTemplate: week,
      days: expandedDays.length > 0 ? expandedDays : week,
      patternType: "weekly",
    });
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error("نام برنامه را وارد کنید");
      return;
    }

    const trainingDays = week.filter((d) => !d.isRestDay);
    const weakDays = trainingDays.filter((d) => d.exercises.length < 3);

    if (weakDays.length > 0) {
      const ok = confirm(
        `${weakDays.length} روز کمتر از ۳ حرکت دارند. آیا ادامه می‌دهید؟`,
      );
      if (!ok) return;
    }

    // اول ذخیره، بعد publish
    await handleSave();
    if (onPublish) {
      await onPublish();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 px-4 h-14 max-w-6xl mx-auto">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" asChild>
              <a href="/coach/plans">
                <ArrowRight className="w-5 h-5" />
              </a>
            </Button>
            <div className="min-w-0">
              <p className="font-semibold truncate">
                {title || "برنامه بدون نام"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {initialPlan?.status === "draft" || !initialPlan
                  ? "پیش‌نویس"
                  : initialPlan.status}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 hidden sm:flex"
              onClick={handleSave}
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
                onClick={handlePublish}
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
              onChange={{
                setTitle,
                setGoal,
                setEquipment,
                setLevel,
                setDurationWeeks,
              }}
              onContinue={() => {
                setShowMeta(false);
                handleSave();
              }}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Week Strip */}
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

          {/* Day Content */}
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
                    : `${currentDay.exercises.length} حرکت`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ApplyWeekButton onApply={applyWeekToWholePlan} />
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
    </div>
  );
}
