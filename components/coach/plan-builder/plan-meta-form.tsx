"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Goal, Equipment } from "@/lib/types/plan";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  goal: Goal;
  equipment: Equipment;
  level: "beginner" | "intermediate" | "advanced";
  durationWeeks: 4 | 6 | 8;
  onChange: {
    setTitle: (v: string) => void;
    setGoal: (v: Goal) => void;
    setEquipment: (v: Equipment) => void;
    setLevel: (v: "beginner" | "intermediate" | "advanced") => void;
    setDurationWeeks: (v: 4 | 6 | 8) => void;
  };
  onContinue: () => void;
};

const goals: { value: Goal; label: string }[] = [
  { value: "lose_weight", label: "کاهش وزن" },
  { value: "build_muscle", label: "عضله‌سازی" },
  { value: "maintain", label: "حفظ تناسب" },
  { value: "endurance", label: "استقامت" },
  { value: "general_fitness", label: "آمادگی عمومی" },
];

const levels = [
  { value: "beginner" as const, label: "مبتدی" },
  { value: "intermediate" as const, label: "متوسط" },
  { value: "advanced" as const, label: "پیشرفته" },
];

const durations = [
  { value: 4 as const, label: "۴ هفته" },
  { value: 6 as const, label: "۶ هفته" },
  { value: 8 as const, label: "۸ هفته" },
];

export function PlanMetaForm({
  title,
  goal,
  level,
  durationWeeks,
  onChange,
  onContinue,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">ساخت برنامه جدید</h1>
        <p className="text-sm text-muted-foreground">
          فقط چند اطلاعات اولیه، بعد مستقیم می‌ریم سراغ ساخت هفته
        </p>
      </div>

      {/* نام */}
      <div className="space-y-2">
        <label className="text-sm font-medium">نام برنامه</label>
        <Input
          value={title}
          onChange={(e) => onChange.setTitle(e.target.value)}
          placeholder="مثلاً: فول‌بادی چربی‌سوزی"
          className="bg-white/5 border-white/10"
        />
      </div>

      {/* هدف */}
      <div className="space-y-2">
        <label className="text-sm font-medium">هدف</label>
        <div className="flex flex-wrap gap-2">
          {goals.map((g) => (
            <button
              key={g.value}
              type="button"
              onClick={() => onChange.setGoal(g.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm transition-colors",
                goal === g.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* سطح */}
      <div className="space-y-2">
        <label className="text-sm font-medium">سطح</label>
        <div className="flex gap-2">
          {levels.map((l) => (
            <button
              key={l.value}
              type="button"
              onClick={() => onChange.setLevel(l.value)}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm transition-colors",
                level === l.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* مدت */}
      <div className="space-y-2">
        <label className="text-sm font-medium">مدت برنامه</label>
        <div className="flex gap-2">
          {durations.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => onChange.setDurationWeeks(d.value)}
              className={cn(
                "flex-1 py-2 rounded-xl text-sm transition-colors",
                durationWeeks === d.value
                  ? "bg-primary text-primary-foreground"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10",
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={onContinue}
        disabled={!title.trim()}
      >
        شروع ساخت هفته
      </Button>
    </div>
  );
}
