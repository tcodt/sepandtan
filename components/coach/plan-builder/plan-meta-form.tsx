"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Goal, Equipment } from "@/lib/types/plan";

type Props = {
  title: string;
  goal: Goal;
  equipment: Equipment;
  level: "beginner" | "intermediate" | "advanced";
  durationWeeks: 4 | 6 | 8;
  priceToman: number | null;
  onChange: {
    setTitle: (v: string) => void;
    setGoal: (v: Goal) => void;
    setEquipment: (v: Equipment) => void;
    setLevel: (v: "beginner" | "intermediate" | "advanced") => void;
    setDurationWeeks: (v: 4 | 6 | 8) => void;
    setPriceToman: (v: number | null) => void;
  };
  onContinue: () => void;
};

export function PlanMetaForm({
  title,
  goal,
  equipment,
  level,
  durationWeeks,
  priceToman,
  onChange,
  onContinue,
}: Props) {
  const canContinue = title.trim().length > 0 && (priceToman ?? 0) > 0;

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">ساخت برنامه جدید</h1>
        <p className="text-sm text-muted-foreground">
          مشخصات برنامه و قیمت را وارد کن، بعد هفته را می‌سازی
        </p>
      </div>

      <div className="space-y-2">
        <Label>نام برنامه</Label>
        <Input
          value={title}
          onChange={(e) => onChange.setTitle(e.target.value)}
          placeholder="مثلاً: فول‌بادی چربی‌سوزی"
        />
      </div>

      <div className="space-y-2">
        <Label>قیمت برنامه (تومان)</Label>
        <Input
          type="number"
          min={0}
          value={priceToman ?? ""}
          onChange={(e) =>
            onChange.setPriceToman(
              e.target.value === "" ? null : Number(e.target.value),
            )
          }
          placeholder="مثلاً 1500000"
        />
        <p className="text-xs text-muted-foreground">
          این قیمت هنگام اختصاص برنامه به هنرجو نمایش داده می‌شود
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>هدف</Label>
          <Select
            value={goal}
            onValueChange={(v) => onChange.setGoal(v as Goal)}
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب هدف" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lose_weight">کاهش وزن</SelectItem>
              <SelectItem value="build_muscle">عضله‌سازی</SelectItem>
              <SelectItem value="maintain">حفظ تناسب</SelectItem>
              <SelectItem value="endurance">استقامت</SelectItem>
              <SelectItem value="general_fitness">آمادگی عمومی</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>سطح</Label>
          <Select
            value={level}
            onValueChange={(v) =>
              onChange.setLevel(v as "beginner" | "intermediate" | "advanced")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="انتخاب سطح" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">مبتدی</SelectItem>
              <SelectItem value="intermediate">متوسط</SelectItem>
              <SelectItem value="advanced">پیشرفته</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>تجهیزات</Label>
          <Select
            value={equipment}
            onValueChange={(v) => onChange.setEquipment(v as Equipment)}
          >
            <SelectTrigger>
              <SelectValue placeholder="تجهیزات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="home">خانگی</SelectItem>
              <SelectItem value="gym">باشگاه</SelectItem>
              <SelectItem value="both">هر دو</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>مدت</Label>
          <Select
            value={String(durationWeeks)}
            onValueChange={(v) =>
              onChange.setDurationWeeks(Number(v) as 4 | 6 | 8)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="مدت" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">۴ هفته</SelectItem>
              <SelectItem value="6">۶ هفته</SelectItem>
              <SelectItem value="8">۸ هفته</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        className="w-full"
        size="lg"
        onClick={onContinue}
        disabled={!canContinue}
      >
        شروع ساخت هفته
      </Button>
    </div>
  );
}
