"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { PlanExercise } from "@/lib/types/plan";
import {
  exercises as allExercises,
  muscleLabels,
  type Exercise,
} from "@/lib/data/exercises";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (exercise: PlanExercise) => void;
};

function getMuscleLabel(ex: Exercise): string {
  if (!ex.primaryMuscles?.length) return "";
  return ex.primaryMuscles.map((m) => muscleLabels[m] ?? m).join("، ");
}

export function AddExerciseSheet({ open, onClose, onAdd }: Props) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("8-12");
  const [restSeconds, setRestSeconds] = useState(90);

  const filtered = useMemo(() => {
    if (!query.trim()) return allExercises.slice(0, 30);
    const q = query.trim().toLowerCase();
    return allExercises
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.nameEn.toLowerCase().includes(q) ||
          e.primaryMuscles.some((m) => (muscleLabels[m] ?? m).includes(q)),
      )
      .slice(0, 30);
  }, [query]);

  const handleConfirm = () => {
    if (!selected) return;

    onAdd({
      exerciseId: selected.id,
      name: selected.name,
      muscle: getMuscleLabel(selected),
      sets,
      reps,
      restSeconds,
    });

    // reset
    setSelected(null);
    setQuery("");
    setSets(3);
    setReps("8-12");
    setRestSeconds(90);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[85vh] rounded-t-3xl bg-background border-white/10"
      >
        <SheetHeader>
          <SheetTitle>افزودن حرکت</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* جستجو */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی حرکت یا عضله..."
              className="pr-10 bg-white/5 border-white/10"
            />
          </div>

          {/* لیست حرکات */}
          {!selected ? (
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {filtered.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setSelected(ex)}
                  className="w-full text-right px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <p className="font-medium text-sm">{ex.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {getMuscleLabel(ex)}
                  </p>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-8">
                  حرکتی پیدا نشد
                </p>
              )}
            </div>
          ) : (
            /* تنظیم پارامترها */
            <div className="space-y-4">
              <div className="rounded-xl bg-white/5 p-4">
                <p className="font-medium">{selected.name}</p>
                <p className="text-xs text-muted-foreground">
                  {getMuscleLabel(selected)}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground">ست</label>
                  <Input
                    type="number"
                    min={1}
                    value={sets}
                    onChange={(e) => setSets(Number(e.target.value) || 1)}
                    className="mt-1 bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">تکرار</label>
                  <Input
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                    className="mt-1 bg-white/5 border-white/10"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">
                    استراحت (ث)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={restSeconds}
                    onChange={(e) =>
                      setRestSeconds(Number(e.target.value) || 0)
                    }
                    className="mt-1 bg-white/5 border-white/10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelected(null)}
                >
                  بازگشت
                </Button>
                <Button className="flex-1" onClick={handleConfirm}>
                  افزودن
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
